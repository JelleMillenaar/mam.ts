"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var curl_1 = require("@iota/curl");
var converter = require("@iota/converter");
function trinarySum(a, b) {
    var result = a + b;
    return result == 2 ? -1 : result == -2 ? 1 : result;
}
function increment(subseed, count) {
    var index = count == null || count < 1 ? 1 : count;
    while (index-- > 0) {
        for (var j = 0; j < 243; j++) {
            if (++subseed[j] > 1) {
                subseed[j] = -1;
            }
            else {
                break;
            }
        }
    }
    return subseed;
}
exports.increment = increment;
// TODO: What to do with keys as type?
function hash(rounds) {
    var keys = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        keys[_i - 1] = arguments[_i];
    }
    var curl = new curl_1.default(rounds);
    var key = new Int8Array(curl_1.default.HASH_LENGTH);
    curl.initialize();
    keys.map(function (k) { return curl.absorb(k, 0, curl_1.default.HASH_LENGTH); });
    curl.squeeze(key, 0, curl_1.default.HASH_LENGTH);
    return key;
}
exports.hash = hash;
//Salt optional? - string return?
function encrypt(message, key, salt) {
    var curl = new curl_1.default();
    curl.initialize();
    curl.absorb(converter.trits(key), 0, key.length);
    if (salt != undefined) { //Undefined in Typescript for optional parameter
        curl.absorb(converter.trits(salt), 0, salt.length);
    }
    var length = message.length * 3;
    var outTrits = new Int32Array(length);
    //NOTICE: Changed from Int32Array to Any as it is passed to curl.squeeze function which only accepts Int8Array.
    var intermediateKey = new Int32Array(curl_1.default.HASH_LENGTH); //Previously accessed from curl object, now the static variable
    return message
        .match(/.{1,81}/g) //Strict null check fails here
        .map(function (m) {
        curl.squeeze(intermediateKey, 0, curl_1.default.HASH_LENGTH);
        var out = converter.trytes(converter
            .trits(m)
            .map(function (t, i) { return trinarySum(t, intermediateKey[i]); }));
        return out;
    })
        .join('');
}
exports.encrypt = encrypt;
//Same comments apply as encrypt
function decrypt(message, key, salt) {
    var curl = new curl_1.default();
    curl.initialize();
    curl.absorb(converter.trits(key), 0, key.length);
    if (salt != undefined) {
        curl.absorb(converter.trits(salt), 0, salt.length);
    }
    var messageTrits = converter.trits(message);
    var length = messageTrits.length;
    var plaintTrits = new Int32Array(length);
    var intermediateKey = new Int32Array(curl_1.default.HASH_LENGTH);
    return message
        .match(/.{1,81}/g)
        .map(function (m) {
        curl.squeeze(intermediateKey, 0, curl_1.default.HASH_LENGTH);
        var out = converter.trytes(converter
            .trits(m)
            .map(function (t, i) { return trinarySum(t, -intermediateKey[i]); }));
        return out;
    })
        .join('');
}
exports.decrypt = decrypt;
//# sourceMappingURL=encryption.js.map