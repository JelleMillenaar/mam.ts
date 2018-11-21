"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var converter = require("@iota/converter");
var Encryption = require("./encryption");
function hash(data, rounds) {
    if (rounds === void 0) { rounds = 81; }
    return converter.trytes(Encryption.hash(rounds, //Removed the || statement with 81 as 81 is now default
    converter.trits(data.slice())).slice());
}
exports.hash = hash;
//# sourceMappingURL=hash.js.map