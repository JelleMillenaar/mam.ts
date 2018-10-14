declare function increment(subseed: number, count: number): number;
declare function hash(rounds: number, ...keys: any[]): Int8Array;
declare function encrypt(message: string, key: string, salt?: string): string;
declare function decrypt(message: string, key: string, salt?: string): string;
export { encrypt, decrypt, increment, hash };
