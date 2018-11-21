import { Transaction } from '@iota/core/typings/types';
import { MAM_MODE, MAM_SECURITY } from './Settings';
/**
 * The Masked Authenticated Messaging (MAM) Writer class is a simplistic class that allows easy MAM use.
 * It has an internal state that handles most complicated logic, which is a lot easier compared to other MAM implementations.
 * A MamReader instance can track the succes of the MamWriter functions.
 * It is recommended to use createAndAttach as the function handles all logic for the user.
 *
 * Masked Authenticated Messaging are 0-value IOTA transaction that contain data messages.
 * This introduces many possibilities for data integrity and communication, but comes with the caveat that message-only signatures are not checked.
 * What the IOTA Foundation introduced is a method of symmetric-key encrypted, signed data that takes advantage of merkle-tree winternitz signatures for extended public key usability, that can be found trivially by those who know to look for it.
 * This is a wrapper library of the WASM/ASM.js output from the IOTA Bindings repository.
 * For a more in depth look at how Masked Authenticated Messaging works please check out the Overview.
 * This wrapper library is based on IOTA Foundations mam.client.js, updated for Typescript and using OOP to ease the use of MAM.
 */
export declare class MamWriter {
    private provider;
    private channel;
    private seed;
    /**
     * Creates a MamWriter channel for the seed. It defaults to a UNSECURE random seed with minimum security 1 and the Public channel mode.
     * @param provider The node URL that connects to the IOTA network to send the requests to.
     * @param seed The seed for the MAM stream, should be kept private. String should contain 81 valid Tryte characters (A-Z+9), otherwise the seed is replaced with a random seed.
     * To keep building on the same stream, the same seed is required. A random UNSECURE seed is generated if no seed is supplied.
     * @param security Security level for the stream. Security 1 is a bit unsecure, but fast and recommended for MAM. Security 2 is secure. Security 3 is for accessive security.
     */
    constructor(provider: string, seed: string, mode: MAM_MODE, sideKey?: string, security?: MAM_SECURITY);
    /**
     * Changes the channel mode. The previous stream on other modes do not "carry over". Restricted mode requires a sidekey, otherwise the mode is not changed.
     * @param mode The new channel mode to set the stream to.
     * @param sideKey The sidekey for Restricted mode use. Does nothing for Public and Private mode.
     */
    changeMode(mode: MAM_MODE, sideKey?: string, security?: MAM_SECURITY): void;
    /**
     *
     * @param message
     * @returns The result of the Attach function.
     */
    createAndAttach(message: string): Promise<Transaction[]>;
    /**
     * Prepares the message by converting it into a valid payload. It also generates the root and address.
     * The payload can be attached to the IOTA network later through the Attach function.
     * It is recommended to use createAndAttach in most cases, unless more direct control is needed or the app runs on an instable internet connection.
     * @param message The message to add to the MAM stream. Expectes a plaintext string or trinary string, depending on inputTrinary.
     * @param inputTrinary A boolean that changes the behavior with the message parameter. If true, the message is considerd a trinary string, otherwise a plaintext string.
     * @returns Returns an object with 3 variables:
     * Payload: The masked message that can be put on the IOTA network as the next MAM message.
     * Root: The root of the message, required to find and decode the message with MamReader.
     * Address: The address were the message will be sent to on the IOTA network. Needed for the Attach function.
     */
    create(message: string, inputTrinary?: boolean): {
        payload: string;
        root: string;
        address: string;
    };
    /**
     * Attaches a previously prepared payload to the IOTA network as part of the MAM stream.
     * @param payload A trinary encoded masked payload created by the create function.
     * @param address The address where the MAM transaction is sent to.
     * @param depth The depth that is used for Tip selection by the node.
     * @param mwm The Proof-of-Work difficulty used. Recommended to use 12 on testnetwork and 14 on the mainnet. (Might be changed later)
     * @returns An array of transactions that have been send to the network.
     */
    attach(payload: string, address: string, depth?: number, mwm?: number): Promise<Transaction[]>;
    /**
     * Useful to call after a MamWriter is created and the input seed has been previously used.
     * This function makes sure that the next message that is added to the MAM stream is appended at the end of the MAM stream.
     * It is required that the entire MAM stream of this seed + mode is avaliable by the given node.
     * @returns An array of the previous roots of all messages used in the stream so far.
     */
    catchUpThroughNetwork(): Promise<string[]>;
    /**
     * @returns The root of the next message. Can be used to later retrieve the message with the MamReader.
     */
    getNextRoot(): string;
    /**
     * @returns The mode of type MAM_MODE of the currently set channel.
     */
    getMode(): MAM_MODE;
    /**
     * @returns The seed of the channel. Don't leak this seed as it gives access to your MAM stream!
     */
    getSeed(): string;
    /**
     * Private function that advanced the merkle tree to the next step for the MAM stream. Sets the channel settings appropriatly.
     * @param root The root of the next MAM transaction.
     */
    private AdvanceChannel;
}
