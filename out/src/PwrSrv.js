"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="bluebird" />
var Promise = require("bluebird");
function CreateAttachToTangleWithPwrSvr(apiKey, timeout, apiServer) {
    return function (trunkTransaction, branchTransaction, minWeightMagnitude, trytes, callback) {
        return new Promise(function (resolve, reject) {
            var command = {
                'command': 'attachToTangle',
                'trunkTransaction': trunkTransaction,
                'branchTransaction': branchTransaction,
                'minWeightMagnitude': minWeightMagnitude,
                'trytes': trytes
            };
            var params = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-IOTA-API-Version': '1'
                },
                body: JSON.stringify(command),
                timeout: timeout //Variable
            };
            if (apiKey)
                params.headers['Authorization'] = 'powsrv-token ' + apiKey;
            fetch(apiServer, params) //Variable
                .then(function (response) {
                if (response.status != 200) {
                    reject("failed to contact the PowSrv API: " + response.status);
                }
                else {
                    response.json().then(function (data) {
                        resolve(data.trytes);
                    });
                    //Can this even go wrong?
                }
            });
        });
    };
}
exports.CreateAttachToTangleWithPwrSvr = CreateAttachToTangleWithPwrSvr;
//# sourceMappingURL=PwrSrv.js.map