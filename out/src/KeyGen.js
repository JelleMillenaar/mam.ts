"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto = require("crypto");
/**
 * Generates a random trinary string that can serve as a seed for MAM transactions. This is not a secure way to generate a seed and is not recommended in production!
 * @param length The length of the key. For a seed 81 characters is required.
 * @returns A string of semi-random Trinary characters of the provided length.
 */
function keyGen(length) {
    var charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
    var key = '';
    while (key.length < length) {
        var byte = crypto.randomBytes(1);
        if (byte[0] < 243) {
            key += charset.charAt(byte[0] % 27);
        }
    }
    return key;
}
exports.keyGen = keyGen;
//# sourceMappingURL=KeyGen.js.map