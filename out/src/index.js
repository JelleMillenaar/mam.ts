"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
//Deps
require('babel-polyfill');
var crypto = require("crypto");
var Encryption = require("./encryption");
var converter = require("@iota/converter");
var core_1 = require("@iota/core");
var node_1 = require("./node"); //New binding?
//Setup Provider
var provider = null;
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
var MAM_MODE;
(function (MAM_MODE) {
    MAM_MODE[MAM_MODE["PUBLIC"] = 0] = "PUBLIC";
    MAM_MODE[MAM_MODE["PRIVATE"] = 1] = "PRIVATE";
    MAM_MODE[MAM_MODE["RESTRICTED"] = 2] = "RESTRICTED";
})(MAM_MODE = exports.MAM_MODE || (exports.MAM_MODE = {}));
var MamWriter = /** @class */ (function () {
    //Replaces init
    function MamWriter(provider, seed, security) {
        if (seed === void 0) { seed = keyGen(81); }
        if (security === void 0) { security = 1; }
        //Set IOTA provider
        this.provider = { provider: provider };
        //Setup Personal Channel
        this.channel = {
            side_key: null,
            mode: MAM_MODE.PUBLIC,
            next_root: null,
            security: security,
            start: 0,
            count: 1,
            next_count: 1,
            index: 0
        };
        //Set other variables (Old returned these)
        this.seed = seed;
    }
    MamWriter.prototype.createAndAttach = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var Result, Result2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Result = this.create(message);
                        return [4 /*yield*/, this.attach(Result.payload, Result.root)];
                    case 1:
                        Result2 = _a.sent();
                        return [2 /*return*/, Result2];
                }
            });
        });
    };
    MamWriter.prototype.changeMode = function (mode, sideKey) {
        //Removed validation of mode
        if (mode == MAM_MODE.RESTRICTED && sideKey == undefined) {
            return console.log('You must specify a side key for a restricted channel');
        }
        //Only set sidekey if it isn't undefined (It is allowed to be null, but not undefined)
        if (sideKey) {
            this.channel.side_key = sideKey;
        }
        this.channel.mode = mode;
        //removed return of the state
    };
    MamWriter.prototype.create = function (message, rounds) {
        if (rounds === void 0) { rounds = 81; }
        //Interact with MAM Lib
        var TrytesMsg = converter.asciiToTrytes(message);
        var mam = node_1.Mam.createMessage(this.seed, TrytesMsg, this.channel.side_key, this.channel); //TODO: This could return an interface format
        //If the tree is exhausted
        if (this.channel.index == this.channel.count - 1) { //Two equals should be enough in typescript
            //change start to beginning of next tree.
            this.channel.start = this.channel.next_count + this.channel.start;
            //Reset index.
            this.channel.index = 0;
        }
        else {
            //Else step the tree.
            this.channel.index++;
        }
        //Advance Channel
        this.channel.next_root = mam.next_root;
        //Generate attachment address
        var address;
        if (this.channel.mode !== MAM_MODE.PUBLIC) {
            console.log(mam.root);
            address = hash(mam.root, rounds);
        }
        else {
            address = mam.root;
        }
        return {
            //Removed state as it is now updated in the class
            payload: mam.payload,
            root: mam.root,
            address: address
        };
    };
    //Todo: Remove the need to pass around root as the class should handle it?
    MamWriter.prototype.attach = function (trytes, address, depth, mwm) {
        if (depth === void 0) { depth = 6; }
        if (mwm === void 0) { mwm = 12; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var transfers;
                        transfers = [{
                                address: address,
                                value: 0,
                                message: trytes
                            }];
                        for (var item in transfers) {
                            console.log(item + transfers[item].address);
                            console.log("NOOOOOOOO");
                        }
                        var sendTrytes = core_1.composeAPI(_this.provider).sendTrytes;
                        var prepareTransfers = core_1.createPrepareTransfers();
                        prepareTransfers('9'.repeat(81), transfers, {})
                            .then(function (transactionTrytes) {
                            sendTrytes(transactionTrytes, depth, mwm)
                                .then(function (transactions) {
                                resolve(transactions);
                            })
                                .catch(function (error) {
                                reject("sendTrytes failed: " + error);
                            });
                        })
                            .catch(function (error) {
                            reject("failed to attach message: " + error);
                        });
                    })];
            });
        });
    };
    //Next root
    MamWriter.prototype.getNextRoot = function () {
        return node_1.Mam.getMamRoot(this.seed, this.channel);
    };
    return MamWriter;
}());
exports.MamWriter = MamWriter;
var MamReader = /** @class */ (function () {
    function MamReader(provider, root, mode, sideKey) {
        if (mode === void 0) { mode = MAM_MODE.PUBLIC; }
        this.sideKey = null;
        //Set the settings
        this.provider = { provider: provider };
        this.changeMode(root, mode, sideKey);
    }
    MamReader.prototype.changeMode = function (root, mode, sideKey) {
        if (mode == MAM_MODE.RESTRICTED && sideKey == undefined) {
            return console.log('You must specify a side key for a restricted channel');
        }
        if (sideKey) {
            this.sideKey = sideKey;
        }
        this.mode = mode;
        //Requires root to be set as the user should make a concise decision to keep the root the same, while they switch the mode (unlikely to be the correct call)
        this.nextRoot = root;
    };
    MamReader.prototype.setRoot = function (root) {
        this.nextRoot = root;
    };
    MamReader.prototype.fetchSingle = function (rounds) {
        if (rounds === void 0) { rounds = 81; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var address = _this.nextRoot;
                        if (_this.mode == MAM_MODE.PRIVATE || _this.mode == MAM_MODE.RESTRICTED) {
                            address = hash(_this.nextRoot, rounds);
                        }
                        var findTransactions = core_1.composeAPI(_this.provider).findTransactions;
                        findTransactions({ addresses: [address] })
                            .then(function (transactionHashes) {
                            console.log("TxHashes:");
                            console.log(transactionHashes);
                            _this.txHashesToMessages(transactionHashes)
                                .then(function (messagesGen) {
                                for (var _i = 0, messagesGen_1 = messagesGen; _i < messagesGen_1.length; _i++) {
                                    var maskedMessage = messagesGen_1[_i];
                                    try {
                                        //Unmask the message
                                        console.log("MaskedMessage:");
                                        console.log(maskedMessage);
                                        var _a = Decode(maskedMessage, _this.sideKey, _this.nextRoot), message = _a.message, nextRoot = _a.nextRoot;
                                        console.log("Message:");
                                        console.log(message);
                                        _this.nextRoot = nextRoot;
                                        //Return payload
                                        console.log("Ascii:");
                                        console.log(converter.trytesToAscii(message));
                                        resolve(converter.trytesToAscii(message));
                                    }
                                    catch (e) {
                                        reject("failed to parse: " + e);
                                    }
                                }
                            })
                                .catch(function (error) {
                                reject("txHashesToMessages failed with " + error);
                            });
                        })
                            .catch(function (error) {
                            reject("findTransactions failed with " + error);
                        });
                    })];
            });
        });
    };
    MamReader.prototype.fetch = function (rounds) {
        if (rounds === void 0) { rounds = 81; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var messages, consumedAll, address, findTransactions;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    messages = [];
                                    consumedAll = false;
                                    _a.label = 1;
                                case 1:
                                    if (!!consumedAll) return [3 /*break*/, 3];
                                    address = this.nextRoot;
                                    if (this.mode == MAM_MODE.PRIVATE || this.mode == MAM_MODE.RESTRICTED) {
                                        address = hash(this.nextRoot, rounds);
                                    }
                                    findTransactions = core_1.composeAPI(this.provider).findTransactions;
                                    return [4 /*yield*/, findTransactions({ addresses: [address] })
                                            .then(function (transactionHashes) { return __awaiter(_this, void 0, void 0, function () {
                                            var _this = this;
                                            return __generator(this, function (_a) {
                                                console.log("then");
                                                //If no hashes are found, we are at the end of the stream
                                                if (transactionHashes.length == 0) {
                                                    consumedAll = true;
                                                }
                                                else { //Continue gathering the messages
                                                    this.txHashesToMessages(transactionHashes)
                                                        .then(function (messagesGen) {
                                                        for (var _i = 0, messagesGen_2 = messagesGen; _i < messagesGen_2.length; _i++) {
                                                            var maskedMessage = messagesGen_2[_i];
                                                            try {
                                                                //Unmask the message
                                                                var _a = Decode(maskedMessage, _this.sideKey, _this.nextRoot), message = _a.message, nextRoot = _a.nextRoot;
                                                                //Store the result
                                                                messages.push(converter.trytesToAscii(message));
                                                                _this.nextRoot = nextRoot;
                                                            }
                                                            catch (e) {
                                                                reject("failed to parse: " + e);
                                                            }
                                                        }
                                                    })
                                                        .catch(function (error) {
                                                        reject("txHashesToMessages failed with " + error);
                                                    });
                                                }
                                                return [2 /*return*/];
                                            });
                                        }); })
                                            .catch(function (error) {
                                            reject("findTransactions failed with " + error);
                                        })];
                                case 2:
                                    _a.sent();
                                    console.log("Done");
                                    return [3 /*break*/, 1];
                                case 3:
                                    resolve(messages);
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    //Next root
    MamReader.prototype.getNextRoot = function () {
        return this.nextRoot;
    };
    MamReader.prototype.txHashesToMessages = function (hashes) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var bundles = [];
                        //For some reason this process supports multiple bundles. Keeping it as it might be a workaround for the length bug
                        var processTx = function (txo) {
                            if (txo.bundle in bundles) {
                                bundles[txo.bundle].push({ index: txo.currentIndex, signatureMessageFragment: txo.signatureMessageFragment });
                            }
                            else {
                                bundles[txo.bundle] = [{ index: txo.currentIndex, signatureMessageFragment: txo.signatureMessageFragment }];
                            }
                            if (bundles[txo.bundle].length == txo.lastIndex + 1) {
                                //Gets the bundle
                                var txMessages = bundles[txo.bundle];
                                delete bundles[txo.bundle];
                                //Sorts the messages in the bundle according to the index
                                txMessages = txMessages.sort(function (a, b) { return (b.index < a.index) ? 1 : -1; });
                                //Reduces the messages to a single messages
                                var Msg = txMessages.reduce(function (acc, n) { return acc + n.signatureMessageFragment; }, '');
                                return Msg;
                            }
                        };
                        var getTransactionObjects = core_1.composeAPI(_this.provider).getTransactionObjects;
                        getTransactionObjects(hashes)
                            .then(function (objs) {
                            var proccesedTxs = objs.map(function (tx) { return processTx(tx); });
                            //Remove undefined from the list. Those are transactions that were not the last in the bundle
                            proccesedTxs = proccesedTxs.filter(function (tx) { return tx !== undefined; });
                            resolve(proccesedTxs);
                        })
                            .catch(function (error) {
                            reject("getTransactionObjects failed with " + error);
                        });
                    })];
            });
        });
    };
    return MamReader;
}());
exports.MamReader = MamReader;
//Export?
function Decode(payload, side_key, root) {
    var Result = node_1.Mam.decodeMessage(payload, side_key, root);
    return { message: Result.payload, nextRoot: Result.next_root };
}
exports.Decode = Decode;
//Export?
function hash(data, rounds) {
    if (rounds === void 0) { rounds = 81; }
    return converter.trytes(Encryption.hash(rounds, //Removed the || statement with 81 as 81 is now default
    converter.trits(data.slice())).slice());
}
exports.hash = hash;
//Export?
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
//# sourceMappingURL=index.js.map