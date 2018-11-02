import { Transaction } from '@iota/core/typings/types';
/**
 * TODO: Add typing - Better use excisting typing in @iota/core and others?
 *
 * Enums:
 * - Security
 * - Mode (Done)
 *
 * Interfaces:
 * - Channel (Done)
 * - Transfers (Done)
 * - Return of Mam.createMessage
 * - Return of create
 *
 * Types:
 * - Seed?
 * - Address?
 */
export declare enum MAM_MODE {
    PUBLIC = 0,
    PRIVATE = 1,
    RESTRICTED = 2
}
export interface channel {
    side_key: string | null;
    mode: MAM_MODE;
    next_root: string | null;
    security: number;
    start: number;
    count: number;
    next_count: number;
    index: number;
}
export declare class MamWriter {
    private provider;
    private channel;
    private seed;
    constructor(provider: string, seed?: string, security?: number);
    createAndAttach(message: string): Promise<Transaction[]>;
    changeMode(mode: MAM_MODE, sideKey?: string): void;
    create(message: string): {
        payload: string;
        root: string;
        address: string;
    };
    attach(trytes: string, root: string, depth?: number, mwm?: number): Promise<Transaction[]>;
    getNextRoot(): any;
}
export declare class MamReader {
    private provider;
    private sideKey;
    private mode;
    private nextRoot;
    constructor(provider: string, root: string, mode?: MAM_MODE, sideKey?: string);
    changeMode(root: string, mode: MAM_MODE, sideKey?: string): void;
    setRoot(root: string): void;
    fetchSingle(rounds?: number): Promise<string>;
    fetch(rounds?: number): Promise<string[]>;
    getNextRoot(): string;
    private txHashesToMessages;
}
export declare function Decode(payload: string, side_key: string, root: string): {
    message: string;
    nextRoot: string;
};
export declare function hash(data: any, rounds?: number): string;
export declare function keyGen(length: number): string;
