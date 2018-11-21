"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MamReader_1 = require("./MamReader");
var Settings_1 = require("./Settings");
var MamListener = /** @class */ (function () {
    function MamListener(provider) {
        //Sets the variables
        this.provider = provider;
        this.subscriptions = [];
    }
    MamListener.prototype.Subscribe = function (interval, callback, root, mode, sideKey) {
        var _this = this;
        if (mode === void 0) { mode = Settings_1.MAM_MODE.PUBLIC; }
        var IndexSub = this.subscriptions.length;
        var newSub = {
            active: true,
            callback: callback,
            reader: new MamReader_1.MamReader(this.provider, root, mode, sideKey),
            timer: setInterval((function () {
                console.log("HELLO!");
                if (_this.subscriptions[IndexSub].active) {
                    //Fetch all messages
                    _this.subscriptions[IndexSub].reader.fetch()
                        .then(function (Messages) {
                        //Messages have been received - Send through callback
                        if (Messages.length) {
                            _this.subscriptions[IndexSub].callback(Messages);
                        }
                    })
                        .catch(function (error) {
                        console.log("Subscription " + IndexSub + " had an issue: " + error);
                    });
                }
                else {
                    //Remove the subscription
                    clearInterval(_this.subscriptions[IndexSub].timer);
                    delete _this.subscriptions[IndexSub];
                }
            }), interval)
        };
        this.subscriptions.push(newSub);
        return IndexSub;
    };
    MamListener.prototype.UnSubscribe = function (index) {
        if (this.subscriptions[index] != undefined) {
            this.subscriptions[index].active = false;
        }
        else {
            console.log("Unsubscribe called with invalid index: " + index);
        }
    };
    MamListener.prototype.CheckForMessages = function (index) {
        var _this = this;
        console.log("HELLO!");
        if (this.subscriptions[index].active) {
            //Fetch all messages
            this.subscriptions[index].reader.fetch()
                .then(function (Messages) {
                //Messages have been received - Send through callback
                if (Messages.length) {
                    _this.subscriptions[index].callback(Messages);
                }
            })
                .catch(function (error) {
                console.log("Subscription " + index + " had an issue: " + error);
            });
        }
        else {
            //Remove the subscription
            clearInterval(this.subscriptions[index].timer);
            delete this.subscriptions[index];
        }
    };
    return MamListener;
}());
exports.MamListener = MamListener;
//# sourceMappingURL=MamListener.js.map