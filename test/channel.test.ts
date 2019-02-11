import test from 'ava'
import { MamWriter, MamReader } from '../src/index';
import { MAM_MODE, MAM_SECURITY } from '../src/Settings';
import { Decode } from '../src/Decode';
import { keyGen } from '../src/KeyGen';

/**
 * Testcase class creates a controlled test situation that covers a range of potential issues with MAM.ts. Every testcase has isolated, except when the same seed is used.
 * Internally has the settings of the testcase and the objects that will execute the testcase.
 */
class TestCase {
    constructor(
        //Settings
        readonly testName : string,
        readonly security : MAM_SECURITY,
        readonly mode : MAM_MODE,
        seed : string | undefined,
        readonly sideKey : string | undefined,
        readonly msg : string,
        readonly tag : string | undefined  
    ) {
        //Create the Writer channel
        this.writer = new MamWriter('https://nodes.thetangle.org:443', seed, this.mode, this.sideKey, this.security);
        this.writer.setTag(this.tag);

        //Create the fetchers
        this.singleReader = new MamReader('https://nodes.thetangle.org:443', this.writer.getNextRoot(), this.mode, this.sideKey);
        this.allReader = new MamReader('https://nodes.thetangle.org:443', this.writer.getNextRoot(), this.mode, this.sideKey);

        //Check the stack of expected messages
        this.expectedMessages = [];
        for(let i=0; i < TestCases.length; i++) {
            //Add message to the queue
            if(TestCases[i].writer.getSeed() == this.writer.getSeed()) {
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
TestCases.push( new TestCase( "Public Mode", MAM_SECURITY.LEVEL_1, MAM_MODE.PUBLIC, Seed, undefined, "Hello World!", undefined) );
TestCases.push( new TestCase( "Catchup Mode & Bad Tag", MAM_SECURITY.LEVEL_1, MAM_MODE.PUBLIC, Seed, undefined, "Hello World the 2nd!", "BadTag2") );
TestCases.push( new TestCase( "Private Mode", MAM_SECURITY.LEVEL_1, MAM_MODE.PRIVATE, undefined, undefined, "Hello World: Private", undefined) );
TestCases.push( new TestCase( "Restricted Mode", MAM_SECURITY.LEVEL_1, MAM_MODE.RESTRICTED, undefined, "Sidekey", "Hello World: Restricted", undefined) );
TestCases.push( new TestCase( "Private Mode, Security 2, Long Message & Tag", MAM_SECURITY.LEVEL_2, MAM_MODE.PRIVATE, undefined, undefined, "Longer Message".repeat(100), "MAM9TS9TEST"));
TestCases.push( new TestCase( "Restricted Mode, Security 3, Long Key & Long Tag", MAM_SECURITY.LEVEL_3, MAM_MODE.RESTRICTED, undefined, "I don't know where I am".repeat(10), "Restricted Stuff", "MAM9TS9TEST".repeat(6)) );


//Loop through all the test cases
for( let Case of TestCases){

    //All code to later add the test cases for the MamListener
    //let listener : MamListener = new MamListener('https://testnet140.tangle.works');
    let listenerResult : string[] = [];
    let listenerCounter = 0;
    /*listener.Subscribe(ListenerLoop, (messages : string[]) => {
        listenerCounter++;
        listenerResult.concat(messages);
        console.log("Subscription Found a thing: ");
        console.log(messages);
    }, writerChannel.getNextRoot(), Case.mode, Case.sideKey);*/
    

    //Test to create a valid transaction
    test.serial('MAM Create: ' + Case.testName, async t => {
        //Assertion plans ensure tests only pass when a specific number of assertions have been executed.
        await Case.writer.catchUpThroughNetwork();
        Case.mamResult = Case.writer.create(Case.msg);

        //Assertion 1: Compare if the object is made
        t.not(Case.mamResult, {payload: undefined, root: undefined, address: undefined},  "We received a new MaM");
    })

    //Mam attach
    test.serial('MAM Attach: ' + Case.testName, async t => {
        let attach = await Case.writer.attach(Case.mamResult.payload, Case.mamResult.address, undefined, 14);
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