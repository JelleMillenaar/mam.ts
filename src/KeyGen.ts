import * as crypto from 'crypto';

/**
 * Generates a random trinary string that can serve as a seed for MAM transactions. This is not a secure way to generate a seed and is not recommended in production!
 * @param length The length of the key. For a seed 81 characters is required.
 * @returns A string of semi-random Trinary characters of the provided length. 
 */
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