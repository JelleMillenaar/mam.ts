import { MAM_MODE } from './Settings';
/**
 * The MamReader can read a MAM stream in several ways. Internally tracks the state of reading.
 */
export declare class MamReader {
    private provider;
    private sideKey;
    private mode;
    private nextRoot;
    constructor(provider: string, root: string, mode?: MAM_MODE, sideKey?: string);
    /**
     * When changeMode is called, the MamReader switches to an entire different stream or point in the stream. Make sure the root is accurately updated.
     * @param root The root of the new stream which is the starting point to start reading the MAM stream from.
     * @param mode The mode of the stream.
     * @param sideKey OPTIONAL. The sidekey is required in restricted mode, otherwise ignored. The sidekey is expected to be in plaintext!
     */
    changeMode(root: string, mode: MAM_MODE, sideKey?: string): void;
    /**
     * Changes the root of the stream. This completely switches stream or jumps back/ahead in the stream. Don't use when just reading a stream, the class updates the root automatically.
     * @param root
     */
    setRoot(root: string): void;
    /**
     * Fetches the SINGLE next transaction in the MAM stream if one has been found, otherwise returns an empty string.
     * The function is asynchronous and should be used as "await MamReaderObject.fetchSingle()" if needed to be synchronous.
     * Can be called in a loop to slowly walk through the MAM messages, but fetch() does that in one go!
     * @returns A promise for a string containing the decode message of the SINGLE next transaction in the stream (Empty string if no message is found)
     */
    fetchSingle(): Promise<string>;
    /**
     * Walks from the current Root to the most recent transaction in the MAM stream and returns the array of string containing all the messages.
     * This is the best and fastest way to catch up on MAM stream.
     * The function is asynchronous and should be used as "await MamReaderObject.fetch()" if needed to be synchronous.
     * @returns A promise of a string array of all the messages in the MAM stream from the root till current. Returns an empty array if no messages are found.
     */
    fetch(): Promise<string[]>;
    /**
     * @returns The next root of the MAM stream
     */
    getNextRoot(): string;
    /**
     * Converts the transactions into the messages contained inside.
     * @param hashes The hashes of the transactions to extract the messages from.
     * @returns A promise of the array of messages contained in the transactions.
     */
    private txHashesToMessages;
}
