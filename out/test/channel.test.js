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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var ava_1 = require("ava");
var index_1 = require("../src/index");
<<<<<<< HEAD
var trytes = null;
var root = null;
var adress = null;
var side_key = "0";
var payload = "";
var _loop_1 = function (item) {
    // Set the security by comparing the current Mam mode (public = 0, private = 1, restricted = 2).
    var security = index_1.MAM_MODE[index_1.MAM_MODE[item]] + 1;
    // Creating default mam writer channel.
    var writerChannel = null;
    // Creating default  mam reader channel.
    var readerChannel = null;
    var Msg = "it's a me, Test IoT";
    //Set the mam channels.
    writerChannel = new index_1.MamWriter('https://testnet140.tangle.works', undefined, security);
    writerChannel.changeMode(index_1.MAM_MODE[item.toString()], side_key);
    readerChannel = new index_1.MamReader('https://testnet140.tangle.works', writerChannel.getNextRoot());
    //Mam create
    ava_1.default.serial('MAM Create, mode ' + index_1.MAM_MODE[item].toLowerCase(), function (t) {
        //Assertion plans ensure tests only pass when a specific number of assertions have been executed.
        t.plan(2);
        t.log("We are now Creating a " + index_1.MAM_MODE[item].toLowerCase() + " MAM!");
        var create = writerChannel.create(Msg.repeat(1));
        //Assertion 1: Compare if the object we receive is not equal to the previous set variables.
        t.not(create, { payload: trytes, root: root, address: adress }, "We received a new MaM");
        trytes = create.payload;
        root = create.root;
        adress = create.address;
        t.log(root);
        //Assertion 2: Passing assertion.
        t.pass("create complete!");
    });
    ava_1.default.serial('MAM Attach, mode ' + index_1.MAM_MODE[item].toLowerCase(), function (t) { return __awaiter(_this, void 0, void 0, function () {
        var attach_1, attach, test, test2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    t.plan(2);
                    t.log("We are now Attaching!");
                    if (!(security == 1)) return [3 /*break*/, 2];
                    return [4 /*yield*/, writerChannel.attach(trytes, root, undefined, 12)];
                case 1:
                    attach_1 = _a.sent();
                    _a.label = 2;
                case 2: return [4 /*yield*/, writerChannel.attach(trytes, adress, undefined, 12)];
                case 3:
                    attach = _a.sent();
                    t.log(Object.keys(attach).values());
                    attach.forEach(function (element) {
                        payload += element.signatureMessageFragment;
                    });
                    t.log("root: " + adress);
                    t.log("side key: " + side_key);
                    test = index_1.Decode(payload, side_key, adress);
                    test2 = index_1.Decode(trytes, side_key, adress);
                    t.deepEqual(test.payload, test2.payload);
                    t.pass(index_1.MAM_MODE[item].toLowerCase() + "attach complete!");
                    return [2 /*return*/];
            }
        });
    }); });
    ava_1.default.serial('MAM Fetch ' + index_1.MAM_MODE[item].toLowerCase(), function (t) { return __awaiter(_this, void 0, void 0, function () {
        var Channel, fetch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Channel = new index_1.MamReader('https://testnet140.tangle.works', root, index_1.MAM_MODE[item.toString()], side_key);
                    t.log("We are now fetching " + index_1.MAM_MODE[item].toLowerCase());
                    return [4 /*yield*/, Channel.fetchSingle()];
                case 1:
                    fetch = _a.sent();
                    t.log(index_1.MAM_MODE[item].toLowerCase() + " fetch complete!");
                    t.log("payload: " + fetch.payload + " next root:" + fetch.nextRoot);
                    t.deepEqual(Msg, fetch.payload);
                    return [2 /*return*/];
            }
        });
    }); });
};
/**
 * We're looping through the Masked Authenticated messaging mode's: Public, Private & Restricted.
 * For each of these mode's we will test the: Create, Attach & Fetch.
 */
// Filter out the none numbers out of the for loop.s
for (var item in Object.keys(index_1.MAM_MODE).filter(function (key) { return isNaN(Number(key)); })) {
    _loop_1(item);
}
=======
//Variables
var Network = 'https://testnet140.tangle.works';
var Security = 1;
var Mode = index_1.MAM_MODE.PRIVATE;
var SideKey = undefined;
var Seed = undefined;
ava_1.default.serial('Send & Receive Public MAM Transaction', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var Channel, Root, create, Attach, Receiver, Result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                Channel = new index_1.MamWriter(Network, Seed, Security);
                Channel.changeMode(Mode, SideKey);
                Root = Channel.getNextRoot();
                console.log("ROOT");
                console.log(Root);
                create = Channel.create("HelloWorld".repeat(10));
                console.log("Created Tx: ");
                console.log(create);
                return [4 /*yield*/, Channel.attach(create.payload, create.address)];
            case 1:
                Attach = _a.sent();
                Receiver = new index_1.MamReader(Network, Root, Mode, SideKey);
                return [4 /*yield*/, Receiver.fetchSingle()];
            case 2:
                Result = _a.sent();
                console.log("Result: ");
                console.log(Result);
                return [2 /*return*/];
        }
    });
}); });
>>>>>>> a6fea1c49534b15ee496c4197ac1a673a90807a5
//# sourceMappingURL=channel.test.js.map