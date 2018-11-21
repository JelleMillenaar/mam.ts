"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_1 = require("./node");
var converter = require("@iota/converter");
/**
 * Translates the received payload to the underlying message and the nextRoot of the MAM stream
 * @param payload The payload to translate. Should be a trinary string.
 * @param side_key The sidekey used for decryption of the message (In restricted mode only). Sidekey is expected to be in plaintext, uneless sideKeyIsTrinary is true, then it should be a Trinary value.
 * @param root The root of the MAM transaction that contained the payload. Used for decryption along with the sidekey.
 * @param sideKeyIsTrinary A boolean value that allows assumes the sidekey is plaintext. If set to true, the sidekey is expected to be given as a trinary value.
 */
function Decode(payload, side_key, root, sideKeyIsTrinary) {
    if (sideKeyIsTrinary === void 0) { sideKeyIsTrinary = false; }
    if (side_key && !sideKeyIsTrinary) {
        side_key = converter.asciiToTrytes(side_key);
    }
    var Result = node_1.Mam.decodeMessage(payload, side_key, root);
    return { message: Result.payload, nextRoot: Result.next_root };
}
exports.Decode = Decode;
//# sourceMappingURL=Decode.js.map