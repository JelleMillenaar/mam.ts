import { MAM_MODE } from './Settings';
export declare class MamListener {
    private provider;
    private reader;
    private subscriptions;
    private subCounter;
    constructor(provider: string);
    Subscribe(interval: number, callback: (messages: string[]) => void, root: string, mode?: MAM_MODE, sideKey?: string): number;
    UnSubscribe(index: number): void;
    private CheckForMessages;
}
