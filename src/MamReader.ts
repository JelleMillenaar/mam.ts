import { MAM_MODE } from './Settings';
import { Settings } from '@iota/http-client/typings/http-client/src/settings'; 
import { hash } from './hash';
import { composeAPI } from '@iota/core';
import * as converter from '@iota/converter';
import { Decode } from './Decode';
import { Transaction } from '@iota/core/typings/types';

/**
 * The MamReader can read a MAM stream in several ways.
 */
export class MamReader {
    private provider : Partial<Settings>;
    private sideKey : string | null = null;
    private mode : MAM_MODE;
    private nextRoot : string;

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
        this.nextRoot = root;
    } 

    public setRoot(root : string) : void { //TODO: Validation of the root as check if it is a valid root
        this.nextRoot = root;
    }

    public async fetchSingle () : Promise<string> { //TODO: test, Returning a Promise correct?
        return new Promise<string> ((resolve, reject) => {
            let address : string = this.nextRoot;
            if( this.mode == MAM_MODE.PRIVATE || this.mode == MAM_MODE.RESTRICTED) {
                address = hash(this.nextRoot);
            }
            //Get the function from the IOTA API
            const { findTransactions } : any = composeAPI( this.provider);

            //Get the next set of transactions send to the next address from the mam stream
            findTransactions({addresses : [address]})
            .then((transactionHashes) => {
                this.txHashesToMessages(transactionHashes)
                .then((messagesGen) => {
                    for( let maskedMessage of messagesGen) {
                        try {
                            //Unmask the message
                            const { message, nextRoot } = Decode(maskedMessage, this.sideKey, this.nextRoot);
                            this.nextRoot = nextRoot;
                            //Return payload
                            resolve( converter.trytesToAscii(message) );
                        } catch(e) {
                            reject(`failed to parse: ${e}`);
                        }
                        //Resolve here

                    }
                })
                .catch((error) => {
                    reject(`txHashesToMessages failed with ${error}`)
                }); 
            })
            .catch((error) => {
                reject(`findTransactions failed with ${error}`);
            });             
        });
    }

    public async fetch() : Promise<string[]> {
        return new Promise<string[]> (async (resolve, reject) => {
            //Set variables
            const messages : string[] = [];
            let consumedAll : boolean = false;

            while(!consumedAll) {
                //Apply channel mode
                let address : string = this.nextRoot;
                if(this.mode == MAM_MODE.PRIVATE || this.mode == MAM_MODE.RESTRICTED) {
                    address = hash(this.nextRoot);
                }

                const { findTransactions } : any = composeAPI( this.provider );
                await findTransactions({addresses : [address]})
                .then(async (transactionHashes) => {
                    console.log("then");
                    //If no hashes are found, we are at the end of the stream
                    if(transactionHashes.length == 0) {
                        consumedAll = true;
                    } else { //Continue gathering the messages
                        this.txHashesToMessages(transactionHashes)
                        .then((messagesGen) => {
                            for( let maskedMessage of messagesGen) {
                                try {
                                    //Unmask the message
                                    const { message, nextRoot } = Decode(maskedMessage, this.sideKey, this.nextRoot);
                                    //Store the result
                                    messages.push( converter.trytesToAscii(message) );
                                    this.nextRoot = nextRoot;
                                } catch(e) {
                                    reject(`failed to parse: ${e}`);
                                }
                            }
                        })
                        .catch((error) => {
                            reject(`txHashesToMessages failed with ${error}`);
                        });
                    }
                })
                .catch((error) => {
                    reject(`findTransactions failed with ${error}`);
                });
                console.log("Done");
            }
            resolve(messages);
        });
    }

    //Next root
    public getNextRoot() {
        return this.nextRoot;
    } 

    private async txHashesToMessages(hashes : string[]) : Promise<string[]> {
        return new Promise<string[]> ((resolve, reject) => {
            let bundles : {index : number, signatureMessageFragment : string}[] = [];
    
            //For some reason this process supports multiple bundles. Keeping it as it might be a workaround for the length bug
            const processTx = function(txo : Transaction) : string {
                if(txo.bundle in bundles) {
                    bundles[txo.bundle].push({index : txo.currentIndex, signatureMessageFragment : txo.signatureMessageFragment});
                } else {
                    bundles[txo.bundle] = [{index : txo.currentIndex, signatureMessageFragment : txo.signatureMessageFragment}];
                }
        
                if(bundles[txo.bundle].length == txo.lastIndex + 1) {
                    //Gets the bundle
                    let txMessages : {index : number, signatureMessageFragment : string}[] = bundles[txo.bundle];
                    delete bundles[txo.bundle];
                    //Sorts the messages in the bundle according to the index
                    txMessages = txMessages.sort((a,b) => (b.index < a.index) ? 1 : -1);
                    //Reduces the messages to a single messages
                    let Msg : string = txMessages.reduce((acc, n) => acc + n.signatureMessageFragment, '');
                    return Msg;
                }
            }

            const { getTransactionObjects } : any = composeAPI( this.provider);
            getTransactionObjects(hashes)
            .then((objs) => {
                let proccesedTxs : string[] = objs.map(tx => processTx(tx));
                //Remove undefined from the list. Those are transactions that were not the last in the bundle
                proccesedTxs = proccesedTxs.filter(tx => tx !== undefined);
                resolve(proccesedTxs);
            })
            .catch((error) => {
                reject(`getTransactionObjects failed with ${error}`);
            });
        });
    }
}