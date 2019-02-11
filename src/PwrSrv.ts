import { AttachToTangle, Hash, Trytes, Callback } from "@iota/core/typings/types";
/// <reference types="bluebird" />
import * as Promise from 'bluebird';

export function CreateAttachToTangleWithPwrSvr( apiKey : string, timeout : number, apiServer : string ) : AttachToTangle {
    return function(trunkTransaction : Hash, branchTransaction : Hash, minWeightMagnitude : number, trytes: ReadonlyArray<Trytes>, callback?: Callback<ReadonlyArray<Trytes>>) : Promise<ReadonlyArray<Trytes>> {
        return new Promise(function (resolve, reject) {
            var command = {
                'command'             : 'attachToTangle',
                'trunkTransaction'    : trunkTransaction,
                'branchTransaction'   : branchTransaction,
                'minWeightMagnitude'  : minWeightMagnitude,
                'trytes'              : trytes
            };
        
            let params = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-IOTA-API-Version': '1'
                },
                body: JSON.stringify(command),
                timeout: timeout //Variable
            };
            if (apiKey) params.headers['Authorization'] = 'powsrv-token ' + apiKey;
            console.log("Sending API Request");
            fetch(apiServer, params) //Variable
            .then(response => {
                if (response.status != 200) {
                    reject(`failed to contact the PowSrv API: ${response.status}`);
                } else {
                    response.json().then(data => {
                        console.log("Data:");
                        console.log(data);
                        debugger;
                        resolve(data.trytes);
                    });
                    //Can this even go wrong?
                }
            })
        });
    }
}