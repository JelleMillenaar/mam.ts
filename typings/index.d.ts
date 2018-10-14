import { Settings } from '@iota/http-client/typings/http-client/src/settings';
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
    PUBLIC = "public",
    PRIVATE = "private",
    RESTRICTED = "restricted"
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
export declare class MAM {
    private provider;
    private channel;
    private seed;
    constructor(provider: Partial<Settings>, seed?: string, security?: number);
    changeMode(mode: MAM_MODE, sideKey?: string): void;
    create(message: string): {
        payload: any;
        root: any;
        address: string;
    };
    attach(trytes: string, root: string, depth?: number, mwm?: number): Promise<void>;
    fetchSingle(root: string, sidekey?: string, rounds?: number): Promise<{
        payload: string;
        nextRoot: string;
    }>;
    fetch(root: string, sidekey?: string, callback?: any, rounds?: number): Promise<{
        nextRoot: string;
        messages: any[];
    }>;
    getRoot(): any;
    static decode(payload: string, side_key: string, root: string): {
        payload: any;
        next_root: any;
    };
    static hash(data: any, rounds?: number): string;
    private txHashesToMessages;
    static keyGen(length: number): string;
}
