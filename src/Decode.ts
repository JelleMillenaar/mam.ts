import { Mam } from './node';
import * as converter from '@iota/converter';

/**
 * Translates the received payload to the underlying message and the nextRoot of the MAM stream
 * @param payload The payload to translate. Should be a trinary string. 
 * @param side_key The sidekey used for decryption of the message (In restricted mode only). Sidekey is expected to be in plaintext, uneless sideKeyIsTrinary is true, then it should be a Trinary value.
 * @param root The root of the MAM transaction that contained the payload. Used for decryption along with the sidekey.
 * @param sideKeyIsTrinary A boolean value that allows assumes the sidekey is plaintext. If set to true, the sidekey is expected to be given as a trinary value.
 */
export function Decode(payload : string, side_key : string, root : string, sideKeyIsTrinary : boolean = false) : { message : string, nextRoot : string } {
    if(side_key && !sideKeyIsTrinary) {
        side_key = converter.asciiToTrytes(side_key);
    }
    let Result : {payload : any, next_root : any} =  Mam.decodeMessage(payload, side_key, root);
    return {message: Result.payload, nextRoot : Result.next_root};
}