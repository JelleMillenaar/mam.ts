import { MamReader } from './MamReader';
import { MAM_MODE } from './Settings';

interface Subscription {
    active : boolean;
    timer : NodeJS.Timeout;
    callback : (messages:string[]) => void;
    reader : MamReader;
}

export class MamListener {
    private provider : string;
    private reader : MamReader;
    private subscriptions : Subscription[];
    private subCounter : number;

    constructor(provider : string) {
        //Sets the variables
        this.provider = provider;
        this.subscriptions = [];
    }

    public Subscribe(interval : number, callback : (messages:string[]) => void, root : string, mode : MAM_MODE = MAM_MODE.PUBLIC, sideKey ?: string) : number {
        let newSub : Subscription;
        newSub.active = true;
        newSub.callback = callback;
        newSub.reader = new MamReader(this.provider, root, mode, sideKey);
        let IndexSub : number = this.subscriptions.length;
        newSub.timer = setInterval((() => {this.CheckForMessages(IndexSub)}), interval);
        this.subscriptions.push(newSub);
        return IndexSub;
    }

    public UnSubscribe(index : number) {
        if(this.subscriptions[index] != undefined) {
            this.subscriptions[index].active = false;
        } else {
            console.log(`Unsubscribe called with invalid index: ${index}`);
        }
    }

    private CheckForMessages(index : number) : void {
        console.log("Beep:"+index);
        if(this.subscriptions[index].active) {
            //Fetch all messages
            this.subscriptions[index].reader.fetch()
            .then((Messages) => {
                //Messages have been received - Send through callback
                if(Messages.length) {
                    this.subscriptions[index].callback(Messages);
                }
            })
            .catch((error) => {
                console.log(`Subscription ${index} had an issue: ${error}`);
            });
        } else {
            //Remove the subscription
            clearInterval(this.subscriptions[index].timer);
            delete this.subscriptions[index];
        }
    }
}