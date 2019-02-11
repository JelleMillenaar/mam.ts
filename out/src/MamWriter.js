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
var http_client_1 = require("@iota/http-client"); //Added for Provider typing
var KeyGen_1 = require("./KeyGen");
var validators_1 = require("@iota/validators");
var node_1 = require("./node");
var converter = require("@iota/converter");
var core_1 = require("@iota/core");
var hash_1 = require("./hash");
var Settings_1 = require("./Settings");
var PwrSrv_1 = require("./PwrSrv");
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
var MamWriter = /** @class */ (function () {
    /**
     * Creates a MamWriter channel for the seed. It defaults to a UNSECURE random seed with minimum security 1 and the Public channel mode.
     * @param provider The node URL that connects to the IOTA network to send the requests to.
     * @param seed The seed for the MAM stream, should be kept private. String should contain 81 valid Tryte characters (A-Z+9), otherwise the seed is replaced with a random seed.
     * To keep building on the same stream, the same seed is required. A random UNSECURE seed is generated if no seed is supplied.
     * @param security Security level for the stream. Security 1 is a bit unsecure, but fast and recommended for MAM. Security 2 is secure. Security 3 is for accessive security.
     */
    function MamWriter(provider, seed, mode, sideKey, security) {
        if (seed === void 0) { seed = KeyGen_1.keyGen(81); }
        if (security === void 0) { security = Settings_1.MAM_SECURITY.LEVEL_1; }
        //Set IOTA provider
        this.provider = http_client_1.createHttpClient({ provider: provider });
        //Check for a valid seed
        if (!validators_1.isTrytesOfExactLength(seed, 81)) {
            console.log('ERROR: Invalid Seed has been submitted. The seed has been replaced with a random seed!');
            seed = KeyGen_1.keyGen(81);
        }
        this.seed = seed;
        this.tag = undefined;
        this.EnablePowSvr(false); //Set default Attach function
        //Set the next root
        this.changeMode(mode, sideKey, security);
    }
    /**
     * Changes the channel mode. The previous stream on other modes do not "carry over". Restricted mode requires a sidekey, otherwise the mode is not changed.
     * @param mode The new channel mode to set the stream to.
     * @param sideKey The sidekey for Restricted mode use. Does nothing for Public and Private mode.
     */
    MamWriter.prototype.changeMode = function (mode, sideKey, security) {
        if (security === void 0) { security = Settings_1.MAM_SECURITY.LEVEL_1; }
        if (mode == Settings_1.MAM_MODE.RESTRICTED && sideKey == undefined) {
            return console.log('You must specify a side key for a restricted channel');
        }
        //Recreate the channel
        this.channel = {
            side_key: null,
            mode: mode,
            next_root: null,
            security: security,
            start: 0,
            count: 1,
            next_count: 1,
            index: 0
        };
        //Only set sidekey if it isn't undefined (It is allowed to be null, but not undefined)
        if (sideKey) {
            this.channel.side_key = converter.asciiToTrytes(sideKey);
        }
        //Set new stuff
        this.channel.mode = mode;
        this.channel.next_root = node_1.Mam.getMamRoot(this.seed, this.channel);
    };
    /**
     *
     * @param message
     * @returns The result of the Attach function.
     */
    MamWriter.prototype.createAndAttach = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var Result, Result2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Result = this.create(message);
                        return [4 /*yield*/, this.attach(Result.payload, Result.address)];
                    case 1:
                        Result2 = _a.sent();
                        return [2 /*return*/, Result2];
                }
            });
        });
    };
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
    MamWriter.prototype.create = function (message, inputTrinary) {
        if (inputTrinary === void 0) { inputTrinary = false; }
        //Interact with MAM Lib
        var TrytesMsg = message;
        if (!inputTrinary) {
            TrytesMsg = converter.asciiToTrytes(message);
        }
        //Only send the side_key when MAM_MODE is not Public
        var mam = node_1.Mam.createMessage(this.seed, TrytesMsg, (this.channel.mode != Settings_1.MAM_MODE.PUBLIC) ? this.channel.side_key : undefined, this.channel);
        //If the tree is exhausted
        this.AdvanceChannel(mam.next_root);
        //Generate attachment address
        var address;
        if (this.channel.mode !== Settings_1.MAM_MODE.PUBLIC) {
            address = hash_1.hash(mam.root);
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
    /**
     * Attaches a previously prepared payload to the IOTA network as part of the MAM stream.
     * @param payload A trinary encoded masked payload created by the create function.
     * @param address The address where the MAM transaction is sent to.
     * @param depth The depth that is used for Tip selection by the node. A depth of 3 is recommended.
     * @param mwm The Proof-of-Work difficulty used. Recommended to use 12 on testnetwork and 14 on the mainnet. (Might be changed later)
     * @returns An array of transactions that have been send to the network.
     */
    MamWriter.prototype.attach = function (payload, address, depth, mwm) {
        if (depth === void 0) { depth = 3; }
        if (mwm === void 0) { mwm = 14; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var transfers;
                        transfers = [{
                                address: address,
                                value: 0,
                                message: payload,
                                tag: _this.tag
                            }];
                        var sendTrytes = core_1.createSendTrytes(_this.provider, _this.attachFunction);
                        var getTransactionsToApprove = core_1.createGetTransactionsToApprove(_this.provider);
                        var storeAndBroadcast = core_1.createStoreAndBroadcast(_this.provider);
                        var prepareTransfers = core_1.createPrepareTransfers();
                        prepareTransfers(_this.seed, transfers, {})
                            .then(function (transactionTrytes) {
                            console.log("Entering");
                            /*getTransactionsToApprove(depth)
                            .tap(input => console.log(input))
                            .then(({ trunkTransaction, branchTransaction }) =>
                                this.attachFunction(trunkTransaction, branchTransaction, mwm, transactionTrytes)
                            )
                            .tap(input => console.log(input))
                            .tap(attachedTrytes => storeAndBroadcast(attachedTrytes))
                            .tap(input => console.log(input))
                            .then(attachedTrytes => attachedTrytes.map(t => asTransactionObject(t)))
                            .tap(input => console.log(input))*/
                            sendTrytes(transactionTrytes, depth, mwm)
                                .then(function (transactions) {
                                console.log("TRANSACTIONS: ");
                                console.log(transactions);
                                resolve(transactions);
                            })
                                .catch(function (error) {
                                reject("sendTrytes failed: " + error + "; Try to switch nodes, this one might not support PoW");
                            });
                        })
                            .catch(function (error) {
                            reject("failed to attach message: " + error);
                        });
                    })];
            });
        });
    };
    MamWriter.prototype.EnablePowSvr = function (enable, apiKey) {
        if (enable) {
            this.attachFunction = PwrSrv_1.CreateAttachToTangleWithPwrSvr(apiKey);
        }
        else {
            //Resets to default Attach function
            this.attachFunction = core_1.createAttachToTangle(this.provider);
        }
    };
    /**
     * Useful to call after a MamWriter is created and the input seed has been previously used.
     * This function makes sure that the next message that is added to the MAM stream is appended at the end of the MAM stream.
     * It is required that the entire MAM stream of this seed + mode is avaliable by the given node.
     * @returns An array of the previous roots of all messages used in the stream so far.
     */
    MamWriter.prototype.catchUpThroughNetwork = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var previousRootes, consumedAll, address, findTransactions;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    previousRootes = [];
                                    consumedAll = false;
                                    _a.label = 1;
                                case 1:
                                    if (!!consumedAll) return [3 /*break*/, 3];
                                    address = this.channel.next_root;
                                    if (this.channel.mode == Settings_1.MAM_MODE.PRIVATE || this.channel.mode == Settings_1.MAM_MODE.RESTRICTED) {
                                        address = hash_1.hash(this.channel.next_root);
                                    }
                                    findTransactions = core_1.createFindTransactions(this.provider);
                                    return [4 /*yield*/, findTransactions({ addresses: [address] })
                                            .then(function (transactionHashes) {
                                            //If no hashes are found, we are at the end of the stream
                                            if (transactionHashes.length == 0) {
                                                consumedAll = true;
                                            }
                                            else {
                                                //Add the root
                                                previousRootes.push(_this.channel.next_root);
                                                //Find the next root - Straight up stolen from node.ts atm. 
                                                var next_root_merkle = node_1.MamDetails.iota_merkle_create(node_1.MamDetails.string_to_ctrits_trits(_this.seed), _this.channel.start + _this.channel.count, _this.channel.next_count, _this.channel.security);
                                                var next_root = node_1.MamDetails.iota_merkle_slice(next_root_merkle);
                                                _this.AdvanceChannel(node_1.MamDetails.ctrits_trits_to_string(next_root));
                                            }
                                        })
                                            .catch(function (error) {
                                            reject("findTransactions failed with " + error);
                                        })];
                                case 2:
                                    _a.sent();
                                    return [3 /*break*/, 1];
                                case 3:
                                    resolve(previousRootes);
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Sets the tag for every mam transaction that will be published afterwards.
     * The tag can be translated to a maximum of 27 trytes and will be pruned if too long.
     * @param tag The tag in plaintext. Only accepts trytes.
     */
    MamWriter.prototype.setTag = function (tag) {
        //If statement is too handle undefined as argument
        if (tag) {
            //Check for valid Trytes
            if (validators_1.isTrytes(tag)) {
                //Trim to correct length
                if (tag.length > 27) {
                    console.log("Warning Tag is too long");
                    tag = tag.slice(0, 26);
                }
                //Append to correct length
                tag += "9".repeat(27 - tag.length);
                this.tag = tag;
            }
            else {
                console.log("Warning, tag doesn't consist of trytes");
            }
        }
    };
    /**
     * @returns The root of the next message. Can be used to later retrieve the message with the MamReader.
     */
    MamWriter.prototype.getNextRoot = function () {
        return node_1.Mam.getMamRoot(this.seed, this.channel);
    };
    /**
     * @returns The mode of type MAM_MODE of the currently set channel.
     */
    MamWriter.prototype.getMode = function () {
        return this.channel.mode;
    };
    /**
     * @returns The seed of the channel. Don't leak this seed as it gives access to your MAM stream!
     */
    MamWriter.prototype.getSeed = function () {
        return this.seed;
    };
    /**
     * @returns The currently set tag that is posted with new MAM tx's.
     */
    MamWriter.prototype.getTag = function () {
        return this.tag;
    };
    /**
     * Private function that advanced the merkle tree to the next step for the MAM stream. Sets the channel settings appropriatly.
     * @param root The root of the next MAM transaction.
     */
    MamWriter.prototype.AdvanceChannel = function (root) {
        //If the tree is exhausted
        if (this.channel.index == this.channel.count - 1) {
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
        this.channel.next_root = root;
    };
    return MamWriter;
}());
exports.MamWriter = MamWriter;
//# sourceMappingURL=MamWriter.js.map