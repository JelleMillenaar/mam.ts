export declare const Mam: {
    decodeMessage: (PAYLOAD: any, SIDE_KEY: any, ROOT: any) => {
        payload: any;
        next_root: any;
    };
    createMessage: (SEED: any, MESSAGE: any, SIDE_KEY: any, CHANNEL: any) => {
        payload: any;
        root: any;
        next_root: any;
        side_key: any;
    };
    getMamAddress: (KEY: any, ROOT: any) => any;
    getMamRoot: (SEED: any, CHANNEL: any) => any;
};
export declare const MamDetails: {
    string_to_ctrits_trits: (str: any) => any;
    iota_merkle_create: any;
    iota_merkle_branch: any;
    iota_merkle_siblings: any;
    iota_merkle_slice: any;
    ctrits_trits_to_string: (ctrits: any) => any;
};
