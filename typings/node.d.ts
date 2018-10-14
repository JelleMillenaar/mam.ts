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
