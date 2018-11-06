import * as crypto from 'crypto';

export function keyGen(length : number) {
    const charset : string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
    let key : string = '';
    while(key.length < length) {
        let byte : Buffer = crypto.randomBytes(1);
        if(byte[0] < 243) {
            key += charset.charAt(byte[0] % 27);
        }
    }
    return key;
}