//Deps
require('babel-polyfill');
import * as crypto from 'crypto';
import * as Encryption from './encryption';
import * as pify from 'pify';
import * as converter from '@iota/converter';
import { composeAPI, createPrepareTransfers, API, createFindTransactions } from '@iota/core';
import { Transaction, Transfer } from '@iota/core/typings/types';
import { Mam } from './node'; //New binding?
import { Settings } from '@iota/http-client/typings/http-client/src/settings'; //Added for Provider typing
import * as Bluebird from 'bluebird'
import { stringify } from 'querystring';

//Setup Provider
let provider : string = null;
//let Mam = {};
//const setupEnv = rustBindings => (Mam = rustBindings);

/**
 * TODO: Add typing - Better use excisting typing in @iota/core and others?
 * 
 * Enums:
 * - Security
 * - Mode (Done)
 * 
 * Interfaces:
 * - Channel (Done)
 * - Transfers (Done)
 * - Return of Mam.createMessage
 * - Return of create
 * 
 * Types:
 * - Seed?
 * - Address?
 */

//NOTE: Rounds become part of the MAMStream, or can that change?

//Introduced a Enum for the mode with string values to allow backwards compatibility. Enum removes the need for string compare checks.
export enum MAM_MODE {
    PUBLIC,
    PRIVATE,
    RESTRICTED
}

export interface channel {
    side_key : string | null;
    mode : MAM_MODE;
    next_root : string | null;
    security : number; //Enum?
    start : number;
    count : number;
    next_count : number;
    index : number;
}

export class MamWriter {
    private provider : Partial<Settings>;
    private channel : channel;
    private seed : string;

    //Replaces init
    constructor(provider: string, seed : string = keyGen(81), security : number = 2) {
        //Set IOTA provider
        this.provider = { provider : provider };

        //Setup Personal Channel
        this.channel = {
            side_key: null,
            mode: MAM_MODE.PUBLIC,
            next_root: null,
            security : security, //This was not set in javascript version?
            start: 0,
            count: 1,
            next_count: 1,
            index: 0
        };
        //Set other variables (Old returned these)
        this.seed = seed;
    }

    public async createAndAttach(message : string) {
        let Result : {payload : string, root : string, address : string} = this.create(message);
        let Result2 = await this.attach(Result.payload, Result.root);
        return Result2;
    }

    public changeMode(mode : MAM_MODE, sideKey ?: string) : void {
        //Removed validation of mode
        if(mode == MAM_MODE.RESTRICTED && sideKey == undefined) {
            return console.log('You must specify a side key for a restricted channel');
        }
        if(sideKey) {
            this.channel.side_key = sideKey;
        }
        this.channel.mode = mode;
        //removed return of the state
    }

    public create(message : string) : {payload : string, root : string, address : string} {
        //Interact with MAM Lib
        let TrytesMsg = converter.asciiToTrytes(message);
        const mam = Mam.createMessage(this.seed, TrytesMsg, this.channel.side_key, this.channel); //TODO: This could return an interface format

        //If the tree is exhausted
        if(this.channel.index == this.channel.count - 1) { //Two equals should be enough in typescript
            //change start to beginning of next tree.
            this.channel.start = this.channel.next_count + this.channel.start;
            //Reset index.
            this.channel.index = 0;
        } else {
            //Else step the tree.
            this.channel.index++;
        }

        //Advance Channel
        this.channel.next_root = mam.next_root;
        //Removed the need to set the channel: state.channel = channel

        //Generate attachment address
        let address : string;
        if(this.channel.mode !== MAM_MODE.PUBLIC) {
            address = converter.trytes( Encryption.hash(81, converter.trits(mam.root.slice())) );
        } else {
            address = mam.root;
        }

        return {
            //Removed state as it is now updated in the class
            payload: mam.payload,
            root: mam.root,
            address
        }
    }

    //Todo: Remove the need to pass around root as the class should handle it?
    public async attach(trytes : string, root : string, depth : number = 6, mwm : number = 12) : Promise<Transaction[]> {
        return new Promise<Transaction[]> ( (resolve, reject) => {
            let transfers : Transfer[];
            transfers = [ {
                address : root,
                value : 0,
                message : trytes
            }];

            const { sendTrytes } : any = composeAPI(this.provider);
            const prepareTransfers = createPrepareTransfers();

            prepareTransfers('9'.repeat(81), transfers, {})
            .then( (transactionTrytes) => {
                sendTrytes(transactionTrytes, depth, mwm)
                .then(transactions => {
                    resolve(<Array<Transaction>>transactions);
                })
                .catch(error => {
                    reject(`sendTrytes failed: ${error}`);
                });
            })
            .catch(error => {
                reject(`failed to attach message: ${error}`);
            });
        });
    }

    //Next root
    public getNextRoot() {
        return Mam.getMamRoot(this.seed, this.channel);
    }  
}

export class MamReader {
    private provider : Partial<Settings>;
    private sideKey : string;
    private mode : MAM_MODE;
    private next_root : string;

    constructor( provider : string, root : string, mode : MAM_MODE = MAM_MODE.PUBLIC, sideKey ?: string) {
        //Set the settings
        this.provider = { provider : provider };
        this.changeMode(root, mode, sideKey);
    }

    public changeMode(root : string, mode : MAM_MODE, sideKey ?: string) : void {
        if(mode == MAM_MODE.RESTRICTED && sideKey == undefined) {
            return console.log('You must specify a side key for a restricted channel');
        }
        if(sideKey) {
            this.sideKey = sideKey;
        }
        this.mode = mode;
        //Requires root to be set as the user should make a concise decision to keep the root the same, while they switch the mode (unlikely to be the correct call)
        this.next_root = root;
    } 

    public async fetchSingle (root : string = this.next_root, mode : MAM_MODE = this.mode, sidekey : string = this.sideKey, rounds : number = 81) : Promise<{ message : string, nextRoot : string}> { //TODO: test, Returning a Promise correct?
        return new Promise<{ message : string, nextRoot : string}> (async (resolve, reject) => {
            let address : string = root;
            if( mode == MAM_MODE.PRIVATE || mode == MAM_MODE.RESTRICTED) {
                address = hash(root, rounds);
            }
            const { findTransactions } : any = composeAPI( this.provider);
            findTransactions({addresses : [address]})
            .then(async (transactionHashes) => {
                const messagesGen = await txHashesToMessages(transactionHashes, this.provider); //Todo: Typing
                for( let message of messagesGen) {
                    try {
                        //Unmask the message
                        const { payload, next_root } = Decode(message, sidekey, root);
                        //Return payload
                        resolve( { message : converter.trytesToAscii(payload), nextRoot : next_root } );
                    } catch(e) {
                        reject(`failed to parse: ${e}`);
                    }
                }
            })
            .catch((error) => {
                reject(`findTransactions failed with ${error}`);
            });             
        });
    }

    //Todo: Type of callback
    public async fetch(callback?, root : string = this.next_root, mode : MAM_MODE = this.mode, sidekey : string = this.sideKey, rounds : number = 81) {
        const messages = [];
        let consumedAll : boolean = false;
        let nextRoot : string = root;
        let transactionCount : number = 0;
        let messageCount : number = 0;

        while(!consumedAll) {
            //Apply channel mode
            let address : string = nextRoot;
            if(mode == MAM_MODE.PRIVATE || mode == MAM_MODE.RESTRICTED) {
                address = hash(nextRoot, rounds);
            }

            const { findTransactions } : any = composeAPI( this.provider );
            const hashes = await pify(findTransactions)({
                addresses: [address]
            });

            if(hashes.length == 0) {
                consumedAll = true;
                break;
            }

            transactionCount += hashes.length;
            messageCount++;
            const messagesGen = await txHashesToMessages(hashes, this.provider);
            for (let message of messagesGen) {
                try {
                    //Unmask the message
                    const {payload, next_root } = Decode(message, sidekey, nextRoot);
                    //Push payload into the messages array
                    if(callback == undefined) {
                        messages.push(payload);
                    } else {
                        callback(payload);
                    }
                    nextRoot = next_root;
                } catch(e) {
                    throw `failed to parse: ${e}`;
                }
            }
        }
        let resp : {nextRoot : string, messages : any[]};
        resp.nextRoot = nextRoot;
        if(callback == undefined) {
            resp.messages = messages;
        }
        return resp;
    }
}

//Export needed?
async function txHashesToMessages(hashes : Bluebird<ReadonlyArray<string>>, provider : Partial<Settings>) {
    let bundles : any = {};

    //TODO: Typing of bundles?
    const processTx = function(txo : Transaction) {
        if(txo.bundle in bundles) {
            bundles[txo.bundle].push([txo.currentIndex, txo.signatureMessageFragment]);
        } else {
            bundles[txo.bundle] = [[txo.currentIndex, txo.signatureMessageFragment]];
        }

        if(bundles[txo.bundle].length == txo.lastIndex + 1) {
            let l : any = bundles[txo.bundle];
            delete bundles[txo.bundle];
            return l
                .sort((a,b) => b[0] < a[0])
                .reduce((acc, n) => acc + n[1], '')
        }
    }
    const { getTransactionObjects } : any = composeAPI( provider);
    const objs : Bluebird<ReadonlyArray<Transaction>> = await pify(getTransactionObjects) (
        hashes
    );
    return objs
        .map(result => processTx(result))
        .filter(item => item !== undefined)
}

export function Decode(payload : string, side_key : string, root : string) {
    return Mam.decodeMessage(payload, side_key, root);
}
//Export?
export function hash (data, rounds = 81) {
    return converter.trytes(
        Encryption.hash( 
            rounds, //Removed the || statement with 81 as 81 is now default
            converter.trits(data.slice()) 
        ).slice()
    );
}

//Export?
export function keyGen(length : number) {
    const charset : string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
    let key : string = '';
    while(key.length < length) {
        let byte : Buffer = crypto.randomBytes(1);
        if(byte[0] < 243) {
            key += charset.charAt(byte[0] % 27);
        }
    }
    return key;
}