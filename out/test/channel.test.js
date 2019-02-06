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
var Settings_1 = require("../src/Settings");
var Decode_1 = require("../src/Decode");
var KeyGen_1 = require("../src/KeyGen");
/**
 * Testcase class creates a controlled test situation that covers a range of potential issues with MAM.ts. Every testcase has isolated, except when the same seed is used.
 * Internally has the settings of the testcase and the objects that will execute the testcase.
 */
var TestCase = /** @class */ (function () {
    function TestCase(
    //Settings
    testName, security, mode, seed, sideKey, msg, tag) {
        this.testName = testName;
        this.security = security;
        this.mode = mode;
        this.sideKey = sideKey;
        this.msg = msg;
        this.tag = tag;
        //Create the Writer channel
        this.writer = new index_1.MamWriter('https://nodes.thetangle.org:443', seed, this.mode, this.sideKey, this.security);
        this.writer.setTag(this.tag);
        //Create the fetchers
        this.singleReader = new index_1.MamReader('https://nodes.thetangle.org:443', this.writer.getNextRoot(), this.mode, this.sideKey);
        this.allReader = new index_1.MamReader('https://nodes.thetangle.org:443', this.writer.getNextRoot(), this.mode, this.sideKey);
        //Check the stack of expected messages
        this.expectedMessages = [];
        for (var i = 0; i < TestCases.length; i++) {
            //Add message to the queue
            if (TestCases[i].writer.getSeed() == this.writer.getSeed()) {
                this.expectedMessages.push(TestCases[i].msg);
            }
        }
        //Add ourselves
        this.expectedMessages.push(this.msg);
    }
    ;
    return TestCase;
}());
//Prepare for the test cases
var Seed = KeyGen_1.keyGen(81);
var TestCases = [];
//Create the test cases
TestCases.push(new TestCase("Public Mode", Settings_1.MAM_SECURITY.LEVEL_1, Settings_1.MAM_MODE.PUBLIC, Seed, undefined, "Hello World!", undefined));
TestCases.push(new TestCase("Catchup Mode & Bad Tag", Settings_1.MAM_SECURITY.LEVEL_1, Settings_1.MAM_MODE.PUBLIC, Seed, undefined, "Hello World the 2nd!", "BadTag2"));
TestCases.push(new TestCase("Private Mode", Settings_1.MAM_SECURITY.LEVEL_1, Settings_1.MAM_MODE.PRIVATE, undefined, undefined, "Hello World: Private", undefined));
TestCases.push(new TestCase("Restricted Mode", Settings_1.MAM_SECURITY.LEVEL_1, Settings_1.MAM_MODE.RESTRICTED, undefined, "Sidekey", "Hello World: Restricted", undefined));
TestCases.push(new TestCase("Private Mode, Security 2, Long Message & Tag", Settings_1.MAM_SECURITY.LEVEL_2, Settings_1.MAM_MODE.PRIVATE, undefined, undefined, "Longer Message".repeat(100), "MAM9TS9TEST"));
TestCases.push(new TestCase("Restricted Mode, Security 3, Long Key & Long Tag", Settings_1.MAM_SECURITY.LEVEL_3, Settings_1.MAM_MODE.RESTRICTED, undefined, "I don't know where I am".repeat(10), "Restricted Stuff", "MAM9TS9TEST".repeat(6)));
var _loop_1 = function (Case) {
    //All code to later add the test cases for the MamListener
    //let listener : MamListener = new MamListener('https://testnet140.tangle.works');
    var listenerResult = [];
    var listenerCounter = 0;
    /*listener.Subscribe(ListenerLoop, (messages : string[]) => {
        listenerCounter++;
        listenerResult.concat(messages);
        console.log("Subscription Found a thing: ");
        console.log(messages);
    }, writerChannel.getNextRoot(), Case.mode, Case.sideKey);*/
    //Test to create a valid transaction
    ava_1.default.serial('MAM Create: ' + Case.testName, function (t) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                //Assertion plans ensure tests only pass when a specific number of assertions have been executed.
                return [4 /*yield*/, Case.writer.catchUpThroughNetwork()];
                case 1:
                    //Assertion plans ensure tests only pass when a specific number of assertions have been executed.
                    _a.sent();
                    Case.mamResult = Case.writer.create(Case.msg);
                    //Assertion 1: Compare if the object is made
                    t.not(Case.mamResult, { payload: undefined, root: undefined, address: undefined }, "We received a new MaM");
                    return [2 /*return*/];
            }
        });
    }); });
    //Mam attach
    ava_1.default.serial('MAM Attach: ' + Case.testName, function (t) { return __awaiter(_this, void 0, void 0, function () {
        var attach, payload, test, test2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Case.writer.attach(Case.mamResult.payload, Case.mamResult.address, undefined, 14)];
                case 1:
                    attach = _a.sent();
                    payload = "";
                    attach.forEach(function (element) {
                        payload += element.signatureMessageFragment;
                    });
                    test = Decode_1.Decode(payload, Case.sideKey, Case.mamResult.root);
                    test2 = Decode_1.Decode(Case.mamResult.payload, Case.sideKey, Case.mamResult.root);
                    t.deepEqual(test.message, test2.message);
                    return [2 /*return*/];
            }
        });
    }); });
    //Fetch Single
    ava_1.default.serial('MAM singleFetch: ' + Case.testName, function (t) { return __awaiter(_this, void 0, void 0, function () {
        var fetch, msg, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fetch = [];
                    _a.label = 1;
                case 1: return [4 /*yield*/, Case.singleReader.fetchSingle()];
                case 2:
                    msg = _a.sent();
                    if (msg.length > 0) {
                        fetch.push(msg);
                    }
                    _a.label = 3;
                case 3:
                    if (msg.length > 0) return [3 /*break*/, 1];
                    _a.label = 4;
                case 4:
                    t.plan(Case.expectedMessages.length);
                    for (i = 0; i < Case.expectedMessages.length; i++) {
                        t.deepEqual(fetch[i], Case.expectedMessages[i]);
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    //Fetch All
    ava_1.default.serial('MAM fetchAll: ' + Case.testName, function (t) { return __awaiter(_this, void 0, void 0, function () {
        var fetch, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Case.allReader.fetch()];
                case 1:
                    fetch = _a.sent();
                    //Need all to match
                    t.plan(Case.expectedMessages.length);
                    for (i = 0; i < Case.expectedMessages.length; i++) {
                        t.deepEqual(fetch[i], Case.expectedMessages[i]);
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    //Listener
    /*test.serial('MAM Listener,  mode ' + Case.mode, async t => {
        await delay(ListenerTimeout);
        let fetch = listenerResult;
        
        //Need all to match
        t.plan(ExpectedMessages.length);
        for(let i=0; i < ExpectedMessages.length; i++) {
            t.deepEqual(fetch[i], ExpectedMessages[i]);
        }

        listener.UnSubscribe(0);
    });*/
};
//Loop through all the test cases
for (var _i = 0, TestCases_1 = TestCases; _i < TestCases_1.length; _i++) {
    var Case = TestCases_1[_i];
    _loop_1(Case);
}
function delay(ms) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
        });
    });
}
//# sourceMappingURL=channel.test.js.map