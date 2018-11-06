import * as converter from '@iota/converter';
import * as Encryption from './encryption';

export function hash (data : string, rounds : number = 81) {
    return converter.trytes(
        Encryption.hash( 
            rounds, //Removed the || statement with 81 as 81 is now default
            converter.trits(data.slice()) 
        ).slice()
    );
}