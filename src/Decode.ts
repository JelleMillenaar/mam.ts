import { Mam } from './node';

export function Decode(payload : string, side_key : string, root : string) : { message : string, nextRoot : string } {
    console.log("Input:")
    console.log(payload);
    console.log(side_key);
    console.log(root);
    let Result : {payload : any, next_root : any} =  Mam.decodeMessage(payload, side_key, root);
    return {message: Result.payload, nextRoot : Result.next_root};
}