import { Settings } from '@iota/http-client/typings/http-client/src/settings'; //Added for Provider typing
import { keyGen } from './KeyGen';
import { isTrytesOfExactLength } from '@iota/validators';
import { Mam, MamDetails } from './node';
import * as converter from '@iota/converter';
import { Transaction, Transfer } from '@iota/core/typings/types';
import { composeAPI, createPrepareTransfers } from '@iota/core';
import { hash } from './hash';
import { MAM_MODE, MAM_SECURITY } from './Settings';

interface channel {
    side_key : string | null;
    mode : MAM_MODE;
    next_root : string | null;
    security : MAM_SECURITY; //Enum?
    start : number;
    count : number;
    next_count : number;
    index : number;
}

/**
 * The Masked Authenticated Messaging (MAM) Writer class is a simplistic class that allows easy MAM use. 
 * It has an internal state that handles most complicated logic, which is a lot easier compared to other MAM implementations.
 * A MamReader instance can track the succes of the MamWriter functions.
 * It is recommended to use createAndAttach as the function handles all logic for the user.
 * 
 * Masked Authenticated Messaging are 0-value IOTA transaction that contain data messages.
 * This introduces many possibilities for data integrity and communication, but comes with the caveat that message-only signatures are not checked. 
 * What the IOTA Foundation introduced is a method of symmetric-key encrypted, signed data that takes advantage of merkle-tree winternitz signatures for extended public key usability, that can be found trivially by those who know to look for it.
 * This is a wrapper library of the WASM/ASM.js output from the IOTA Bindings repository. 
 * For a more in depth look at how Masked Authenticated Messaging works please check out the Overview.
 * This wrapper library is based on IOTA Foundations mam.client.js, updated for Typescript and using OOP to ease the use of MAM.
 */
export class MamWriter {
    private provider : Partial<Settings>;
    private channel : channel;
    private seed : string;

    /**
     * Creates a MamWriter channel for the seed. It defaults to a UNSECURE random seed with minimum security 1 and the Public channel mode.
     * @param provider The node URL that connects to the IOTA network to send the requests to. 
     * @param seed The seed for the MAM stream, should be kept private. String should contain 81 valid Tryte characters (A-Z+9), otherwise the seed is replaced with a random seed.
     * To keep building on the same stream, the same seed is required. A random UNSECURE seed is generated if no seed is supplied.
     * @param security Security level for the stream. Security 1 is a bit unsecure, but fast and recommended for MAM. Security 2 is secure. Security 3 is for accessive security.
     */
    constructor(provider: string, seed : string = keyGen(81), security : MAM_SECURITY = MAM_SECURITY.LEVEL_1) {
        //Set IOTA provider
        this.provider = { provider : provider };

        //Check for a valid seed
        if(!isTrytesOfExactLength(seed, 81)) {
            console.log('ERROR: Invalid Seed has been submitted. The seed has been replaced with a random seed!');
            seed = keyGen(81);
        }
        this.seed = seed;

        //Set the next root
        this.changeMode(MAM_MODE.PUBLIC);
    }

    /**
     * Changes the channel mode. The previous stream on other modes do not "carry over". Restricted mode requires a sidekey, otherwise the mode is not changed.
     * @param mode The new channel mode to set the stream to.
     * @param sideKey The sidekey for Restricted mode use. Does nothing for Public and Private mode. 
     */
    public changeMode(mode : MAM_MODE, sideKey ?: string, security : MAM_SECURITY = MAM_SECURITY.LEVEL_1) : void {
        if(mode == MAM_MODE.RESTRICTED && sideKey == undefined) {
            return console.log('You must specify a side key for a restricted channel');
        }
        
        //Recreate the channel
        this.channel = {
            side_key: null,
            mode: mode,
            next_root: null,
            security : security,
            start: 0,
            count: 1,
            next_count: 1,
            index: 0
        };

        //Only set sidekey if it isn't undefined (It is allowed to be null, but not undefined)
        if(sideKey) {
            this.channel.side_key = sideKey;
        }

        //Set new stuff
        this.channel.mode = mode;
        this.channel.next_root = Mam.getMamRoot(this.seed, this.channel);
    }

    /**
     * 
     * @param message 
     * @returns The result of the Attach function.
     */
    public async createAndAttach(message : string) {
        let Result : {payload : string, root : string, address : string} = this.create(message);
        let Result2 = await this.attach(Result.payload, Result.address);
        return Result2;
    }

    /**
     * Prepares the message by converting it into a valid payload. It also generates the root and address.
     * The payload can be attached to the IOTA network later through the Attach function.
     * It is recommended to use createAndAttach in most cases, unless more direct control is needed or the app runs on an instable internet connection.
     * @param message The message to add to the MAM stream. Expectes a plaintext string or trinary string, depending on inputTrinary.
     * @param inputTrinary A boolean that changes the behavior with the message parameter. If true, the message is considerd a trinary string, otherwise a plaintext string.
     * @returns Returns an object with 3 variables:
     * Payload: The masked message that can be put on the IOTA network as the next MAM message.
     * Root: The root of the message, required to find and decode the message with MamReader.
     * Address: The address were the message will be sent to on the IOTA network. Needed for the Attach function.
     */
    public create(message : string, inputTrinary : boolean = false) : {payload : string, root : string, address : string} {
        //Interact with MAM Lib
        let TrytesMsg = message;
        if(!inputTrinary) {
            TrytesMsg = converter.asciiToTrytes(message);
        }
        const mam = Mam.createMessage(this.seed, TrytesMsg, this.channel.side_key, this.channel); //TODO: This could return an interface format

        //If the tree is exhausted
        this.AdvanceChannel(mam.next_root);

        //Generate attachment address
        let address : string;
        if(this.channel.mode !== MAM_MODE.PUBLIC) {
            address = hash(mam.root);
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

    /**
     * Attaches a previously prepared payload to the IOTA network as part of the MAM stream.
     * @param payload A trinary encoded masked payload created by the create function.
     * @param address The address where the MAM transaction is sent to.
     * @param depth The depth that is used for Tip selection by the node.
     * @param mwm The Proof-of-Work difficulty used. Recommended to use 12 on testnetwork and 14 on the mainnet. (Might be changed later)
     * @returns An array of transactions that have been send to the network. 
     */
    public async attach(payload : string, address : string, depth : number = 6, mwm : number = 14) : Promise<Transaction[]> {
        return new Promise<Transaction[]> ( (resolve, reject) => {
            let transfers : Transfer[];
            transfers = [ {
                address : address,
                value : 0,
                message : payload
            }];
            const { sendTrytes } : any = composeAPI(this.provider);
            const prepareTransfers = createPrepareTransfers();
            prepareTransfers(this.seed, transfers, {})
            .then( (transactionTrytes) => {
                sendTrytes(transactionTrytes, depth, mwm)
                .then(transactions => {
                    resolve(<Array<Transaction>>transactions);
                })
                .catch(error => {
                    reject(`sendTrytes failed: ${error}; Try to switch nodes, this one might not support PoW`);
                });
            })
            .catch(error => {
                reject(`failed to attach message: ${error}`);
            });
        });
    }

    /**
     * Useful to call after a MamWriter is created and the input seed has been previously used. 
     * This function makes sure that the next message that is added to the MAM stream is appended at the end of the MAM stream.
     * It is required that the entire MAM stream of this seed + mode is avaliable by the given node.
     * @returns An array of the previous roots of all messages used in the stream so far.
     */
    public async catchUpThroughNetwork() : Promise<string[]> {
        return new Promise<string[]> (async (resolve, reject) => {
            //Set variables
            let previousRootes : string[] = [];
            let consumedAll : boolean = false;

            while(!consumedAll) {
                //Apply channel mode
                let address : string = this.channel.next_root;
                if(this.channel.mode == MAM_MODE.PRIVATE || this.channel.mode == MAM_MODE.RESTRICTED) {
                    address = hash(this.channel.next_root);
                }

                const { findTransactions } : any = composeAPI( this.provider );
                await findTransactions({addresses : [address]})
                .then((transactionHashes) => {
                    //If no hashes are found, we are at the end of the stream
                    if(transactionHashes.length == 0) {
                        consumedAll = true;
                    } else { 
                        //Add the root
                        previousRootes.push(this.channel.next_root);

                        //Find the next root - Straight up stolen from node.ts atm. 
                        let next_root_merkle = MamDetails.iota_merkle_create( MamDetails.string_to_ctrits_trits(this.seed), this.channel.start + this.channel.count, this.channel.next_count, this.channel.security );
                        let next_root = MamDetails.iota_merkle_slice(next_root_merkle);
                        this.AdvanceChannel ( MamDetails.ctrits_trits_to_string(next_root) );
                    }
                })
                .catch((error) => {
                    reject(`findTransactions failed with ${error}`);
                });
            }
            resolve(previousRootes);
        });
    }

    /**
     * @returns The root of the next message. Can be used to later retrieve the message with the MamReader.
     */
    public getNextRoot() : string {
        return Mam.getMamRoot(this.seed, this.channel);
    }  

    /**
     * @returns The mode of type MAM_MODE of the currently set channel.
     */
    public getMode() : MAM_MODE {
        return this.channel.mode;
    }

    /**
     * Private function that advanced the merkle tree to the next step for the MAM stream. Sets the channel settings appropriatly. 
     * @param root The root of the next MAM transaction.
     */
    private AdvanceChannel(root : string) {
        //If the tree is exhausted
        if(this.channel.index == this.channel.count - 1) {
            //change start to beginning of next tree.
            this.channel.start = this.channel.next_count + this.channel.start;
            //Reset index.
            this.channel.index = 0;
        } else {
            //Else step the tree.
            this.channel.index++;
        }

        //Advance Channel
        this.channel.next_root = root;
    }
}