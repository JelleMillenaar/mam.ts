import Curl from '@iota/curl';
import * as converter from '@iota/converter';

function trinarySum( a : number, b : number) : number {
    const result : number = a + b;
    return result == 2 ? -1 : result == -2 ? 1 : result;
}

function increment(subseed : number, count : number) : number {
    let index : number = count == null || count < 1 ? 1 : count;
    while(index-- > 0) {
        for (let j : number = 0; j < 243; j++) {
            if(++subseed[j] > 1) {
                subseed[j] = -1;
            } else {
                break;
            }
        }
    }
    return subseed;
}

// TODO: What to do with keys as type?
function hash(rounds : number, ...keys) : Int8Array {
    const curl : Curl = new Curl(rounds);
    const key : Int8Array = new Int8Array(Curl.HASH_LENGTH);
    curl.initialize();
    keys.map(k => curl.absorb(k, 0, Curl.HASH_LENGTH));
    curl.squeeze(key, 0, Curl.HASH_LENGTH);
    return key;
}

//Salt optional? - string return?
function encrypt(message : string, key : string, salt?: string) : string {
    const curl : Curl = new Curl();
    curl.initialize();
    curl.absorb(converter.trits(key), 0, key.length);
    if( salt != undefined) { //Undefined in Typescript for optional parameter
        curl.absorb(converter.trits(salt), 0, salt.length);
    }
    const length : number = message.length * 3;
    const outTrits : Int32Array = new Int32Array(length);
    //NOTICE: Changed from Int32Array to Any as it is passed to curl.squeeze function which only accepts Int8Array.
    const intermediateKey : any = new Int32Array(Curl.HASH_LENGTH); //Previously accessed from curl object, now the static variable
    return message
        .match(/.{1,81}/g) //Strict null check fails here
        .map(m => {
            curl.squeeze(intermediateKey, 0, Curl.HASH_LENGTH); 
            const out : string = converter.trytes(
                converter
                    .trits(m)
                    .map((t, i) => trinarySum(t, intermediateKey[i]))
            );
            return out;
        })
        .join('');
}

//Same comments apply as encrypt
function decrypt(message : string, key : string, salt?: string) : string {
    const curl : Curl = new Curl();
    curl.initialize();
    curl.absorb(converter.trits(key), 0, key.length);
    if(salt != undefined) {
        curl.absorb(converter.trits(salt), 0 , salt.length);
    }
    const messageTrits : Int8Array = converter.trits(message);
    const length : number = messageTrits.length;
    const plaintTrits : Int32Array = new Int32Array(length);
    const intermediateKey : any = new Int32Array(Curl.HASH_LENGTH);
    return message
        .match(/.{1,81}/g)
        .map(m => {
            curl.squeeze(intermediateKey, 0, Curl.HASH_LENGTH)
            const out : string = converter.trytes(
                converter
                    .trits(m)
                    .map((t, i) => trinarySum(t, -intermediateKey[i]))
            )
            return out
        })
        .join('')
}

export {
    encrypt,
    decrypt,
    increment,
    hash
}