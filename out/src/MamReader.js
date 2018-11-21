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
var Settings_1 = require("./Settings");
var hash_1 = require("./hash");
var core_1 = require("@iota/core");
var converter = require("@iota/converter");
var Decode_1 = require("./Decode");
/**
 * The MamReader can read a MAM stream in several ways. Internally tracks the state of reading.
 */
var MamReader = /** @class */ (function () {
    function MamReader(provider, root, mode, sideKey) {
        if (mode === void 0) { mode = Settings_1.MAM_MODE.PUBLIC; }
        this.sideKey = undefined;
        //Set the settings
        this.provider = { provider: provider };
        this.changeMode(root, mode, sideKey);
    }
    /**
     * When changeMode is called, the MamReader switches to an entire different stream or point in the stream. Make sure the root is accurately updated.
     * @param root The root of the new stream which is the starting point to start reading the MAM stream from.
     * @param mode The mode of the stream.
     * @param sideKey OPTIONAL. The sidekey is required in restricted mode, otherwise ignored. The sidekey is expected to be in plaintext!
     */
    MamReader.prototype.changeMode = function (root, mode, sideKey) {
        if (mode == Settings_1.MAM_MODE.RESTRICTED && sideKey == undefined) {
            return console.log('You must specify a side key for a restricted channel');
        }
        if (sideKey) {
            this.sideKey = converter.asciiToTrytes(sideKey);
        }
        this.mode = mode;
        //Requires root to be set as the user should make a concise decision to keep the root the same, while they switch the mode (unlikely to be the correct call)
        this.nextRoot = root;
    };
    /**
     * Changes the root of the stream. This completely switches stream or jumps back/ahead in the stream. Don't use when just reading a stream, the class updates the root automatically.
     * @param root
     */
    MamReader.prototype.setRoot = function (root) {
        this.nextRoot = root;
    };
    /**
     * Fetches the SINGLE next transaction in the MAM stream if one has been found, otherwise returns an empty string.
     * The function is asynchronous and should be used as "await MamReaderObject.fetchSingle()" if needed to be synchronous.
     * Can be called in a loop to slowly walk through the MAM messages, but fetch() does that in one go!
     * @returns A promise for a string containing the decode message of the SINGLE next transaction in the stream (Empty string if no message is found)
     */
    MamReader.prototype.fetchSingle = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var ReturnMessage = "";
                        var address = _this.nextRoot;
                        if (_this.mode == Settings_1.MAM_MODE.PRIVATE || _this.mode == Settings_1.MAM_MODE.RESTRICTED) {
                            address = hash_1.hash(_this.nextRoot);
                        }
                        //Get the function from the IOTA API
                        var findTransactions = core_1.composeAPI(_this.provider).findTransactions;
                        //Get the next set of transactions send to the next address from the mam stream
                        findTransactions({ addresses: [address] })
                            .then(function (transactionHashes) { return __awaiter(_this, void 0, void 0, function () {
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!transactionHashes.length) return [3 /*break*/, 2];
                                        return [4 /*yield*/, this.txHashesToMessages(transactionHashes)
                                                .then(function (messagesGen) {
                                                for (var _i = 0, messagesGen_1 = messagesGen; _i < messagesGen_1.length; _i++) {
                                                    var maskedMessage = messagesGen_1[_i];
                                                    var message = void 0;
                                                    var nextRoot = void 0;
                                                    var ConvertedMsg = void 0;
                                                    try {
                                                        //Unmask the message
                                                        var _a = Decode_1.Decode(maskedMessage, _this.sideKey, _this.nextRoot, true), message_1 = _a.message, nextRoot_1 = _a.nextRoot;
                                                        _this.nextRoot = nextRoot_1;
                                                        //Return payload
                                                        ConvertedMsg = converter.trytesToAscii(message_1);
                                                        ReturnMessage = ReturnMessage.concat(ConvertedMsg);
                                                    }
                                                    catch (e) {
                                                        console.log("MaskedMessage:");
                                                        console.log(maskedMessage);
                                                        console.log('Message:');
                                                        console.log(message);
                                                        console.log('Root');
                                                        console.log(nextRoot);
                                                        console.log('Converted Message');
                                                        console.log(ConvertedMsg);
                                                        reject("failed to parse: " + e);
                                                    }
                                                }
                                            })
                                                .catch(function (error) {
                                                reject("txHashesToMessages failed with " + error);
                                            })];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2:
                                        resolve(ReturnMessage);
                                        return [2 /*return*/];
                                }
                            });
                        }); })
                            .catch(function (error) {
                            reject("findTransactions failed with " + error);
                        });
                    })];
            });
        });
    };
    /**
     * Walks from the current Root to the most recent transaction in the MAM stream and returns the array of string containing all the messages.
     * This is the best and fastest way to catch up on MAM stream.
     * The function is asynchronous and should be used as "await MamReaderObject.fetch()" if needed to be synchronous.
     * @returns A promise of a string array of all the messages in the MAM stream from the root till current. Returns an empty array if no messages are found.
     */
    MamReader.prototype.fetch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var messages, consumedAll, Counter, address, findTransactions;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    messages = [];
                                    consumedAll = false;
                                    Counter = 0;
                                    _a.label = 1;
                                case 1:
                                    if (!!consumedAll) return [3 /*break*/, 3];
                                    address = this.nextRoot;
                                    if (this.mode == Settings_1.MAM_MODE.PRIVATE || this.mode == Settings_1.MAM_MODE.RESTRICTED) {
                                        address = hash_1.hash(this.nextRoot);
                                    }
                                    findTransactions = core_1.composeAPI(this.provider).findTransactions;
                                    return [4 /*yield*/, findTransactions({ addresses: [address] })
                                            .then(function (transactionHashes) { return __awaiter(_this, void 0, void 0, function () {
                                            var _this = this;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        if (!(transactionHashes.length == 0)) return [3 /*break*/, 1];
                                                        consumedAll = true;
                                                        return [3 /*break*/, 3];
                                                    case 1: //Continue gathering the messages
                                                    return [4 /*yield*/, this.txHashesToMessages(transactionHashes)
                                                            .then(function (messagesGen) {
                                                            for (var _i = 0, messagesGen_2 = messagesGen; _i < messagesGen_2.length; _i++) {
                                                                var maskedMessage = messagesGen_2[_i];
                                                                try {
                                                                    //Unmask the message
                                                                    var _a = Decode_1.Decode(maskedMessage, _this.sideKey, _this.nextRoot, true), message = _a.message, nextRoot = _a.nextRoot;
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
                                                        })];
                                                    case 2:
                                                        _a.sent();
                                                        _a.label = 3;
                                                    case 3: return [2 /*return*/];
                                                }
                                            });
                                        }); })
                                            .catch(function (error) {
                                            reject("findTransactions failed with " + error);
                                        })];
                                case 2:
                                    _a.sent();
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
    /**
     * @returns The next root of the MAM stream
     */
    MamReader.prototype.getNextRoot = function () {
        return this.nextRoot;
    };
    /**
     * Converts the transactions into the messages contained inside.
     * @param hashes The hashes of the transactions to extract the messages from.
     * @returns A promise of the array of messages contained in the transactions.
     */
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
//# sourceMappingURL=MamReader.js.map