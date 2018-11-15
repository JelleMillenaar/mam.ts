import test from 'ava'
import { MamWriter, MamReader, MamListener } from '../src/index';
import { MAM_MODE, MAM_SECURITY } from '../src/Settings';
import { Decode } from '../src/Decode';
import { keyGen } from '../src/KeyGen';

class TestCase {
    constructor(
        //Settings
        readonly testName : string,
        readonly security : MAM_SECURITY,
        readonly mode : MAM_MODE,
        readonly seed : string | undefined,
        readonly sideKey : string | undefined,
        readonly msg : string  
    ) {
        //Create the Writer channel
        this.writer = new MamWriter('https://pow3.iota.community:443', this.seed, this.security);
        this.writer.changeMode(this.mode, this.sideKey);

        //Create the fetchers
        this.singleReader = new MamReader('https://pow3.iota.community:443', this.writer.getNextRoot());
        this.allReader = new MamReader('https://pow3.iota.community:443', this.writer.getNextRoot());

        //Check the stack of expected messages
        this.expectedMessages = [];
        for(let i=0; i < TestCases.length; i++) {
            //Add message to the queue
            if(TestCases[i].seed == this.seed) {
                this.expectedMessages.push(TestCases[i].msg);
            }
        }
        //Add ourselves
        this.expectedMessages.push(this.msg);
    };

    //Objects
    public writer : MamWriter;
    public singleReader : MamReader;
    public allReader : MamReader;
    public expectedMessages : string[];
    public mamResult : {payload : string, root : string, address : string};
}

//Prepare for the test cases
let Seed = keyGen(81);
let TestCases : TestCase[] = [];

//Create the test cases
//TestCases.push( new TestCase( "Public Mode", MAM_SECURITY.LEVEL_1, MAM_MODE.PUBLIC, Seed, undefined, "Hello World!") );
//TestCases.push( new TestCase( "Catchup Mode", MAM_SECURITY.LEVEL_1, MAM_MODE.PUBLIC, Seed, undefined, "Hello World the 2nd!") );
TestCases.push( new TestCase( "Private Mode", MAM_SECURITY.LEVEL_1, MAM_MODE.PRIVATE, undefined, undefined, "Hello World: Private") );
//TestCases.push( new TestCase( "Restricted Mode", MAM_SECURITY.LEVEL_1, MAM_MODE.RESTRICTED, undefined, "999ABC", "Hello World: Restricted") );
/**
 * We're looping through the Masked Authenticated messaging mode's: Public, Private & Restricted.
 * For each of these mode's we will test the: Create, Attach & Fetch.
 */

//https://nodes.devnet.thetangle.org:443
//https://testnet140.tangle.works

 // Filter out the none numbers out of the for loop.
for( let Case of TestCases){
    //let listener : MamListener = new MamListener('https://testnet140.tangle.works');
    let listenerResult : string[] = [];
    let listenerCounter = 0;
    /*listener.Subscribe(ListenerLoop, (messages : string[]) => {
        listenerCounter++;
        listenerResult.concat(messages);
        console.log("Subscription Found a thing: ");
        console.log(messages);
    }, writerChannel.getNextRoot(), Case.mode, Case.sideKey);*/
    

    //Mam create
    test.serial('MAM Create: ' + Case.testName, async t => {
        //Assertion plans ensure tests only pass when a specific number of assertions have been executed.
        await Case.writer.catchUpThroughNetwork();
        Case.mamResult = Case.writer.create(Case.msg);

        //Assertion 1: Compare if the object is made
        t.not(Case.mamResult, {payload: undefined, root: undefined, address: undefined},  "We received a new MaM");
    })

    //Mam attach
    test.serial('MAM Attach: ' + Case.testName, async t => {
        console.log("NextRoot:");
        console.log(Case.writer.getNextRoot());
        let attach = await Case.writer.attach(Case.mamResult.payload, Case.mamResult.address, undefined, 14);
        console.log("Attach:");
        console.log(attach);
        let payload = "";
        attach.forEach(element => {
            payload += element.signatureMessageFragment;
        });
        let test = Decode(payload, Case.sideKey, Case.mamResult.root);
        let test2 = Decode(Case.mamResult.payload, Case.sideKey, Case.mamResult.root);
        t.deepEqual(test.message, test2.message);
    })

    //Fetch Single
    test.serial('MAM singleFetch: ' + Case.testName, async t => {
        let fetch : string[] = [];
        let msg : string;
        
        do {
            msg = await Case.singleReader.fetchSingle();
            if(msg.length > 0) {
                fetch.push( msg );
            }
        } while (msg.length > 0);
        t.plan(Case.expectedMessages.length);
        for(let i=0; i < Case.expectedMessages.length; i++) {
            t.deepEqual(fetch[i], Case.expectedMessages[i]);
        }
    });

    //Fetch All
    test.serial('MAM fetchAll: ' + Case.testName, async t => {
        let fetch = await Case.allReader.fetch();
        
        //Need all to match
        t.plan(Case.expectedMessages.length);
        for(let i=0; i < Case.expectedMessages.length; i++) {
            t.deepEqual(fetch[i], Case.expectedMessages[i]);
        }
    });

    //Listener
    /*test.serial('MAM Listener,  mode ' + Case.mode, async t => {
        await delay(ListenerTimeout);
        let fetch = listenerResult;
        
        //Need all to match
        t.plan(ExpectedMessages.length);
        for(let i=0; i < ExpectedMessages.length; i++) {
            t.deepEqual(fetch[i], ExpectedMessages[i]);
        }

        listener.UnSubscribe(0);
    });*/

}

async function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}