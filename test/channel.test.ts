import test from 'ava'
import { MamWriter, MamReader, MamListener } from '../src/index';
import { MAM_MODE, MAM_SECURITY } from '../src/Settings';
import { Decode } from '../src/Decode';

interface TestCase {
    security : MAM_SECURITY;
    mode : MAM_MODE;
    seed : string | undefined;
    sideKey : string | undefined;
    msg : string;
}

//Create the test cases
let ListenerTimeout = 15000;
let ListenerLoop = ListenerTimeout / 1;
let TestCases : TestCase[] = [];
//TestCases.push( {security : MAM_SECURITY.LEVEL_1, mode : MAM_MODE.PUBLIC, seed : undefined, sideKey : undefined, msg: "Hello World!"} );
TestCases.push( {security : MAM_SECURITY.LEVEL_1, mode : MAM_MODE.PRIVATE, seed : undefined, sideKey : undefined, msg: "Hello World!"} );
TestCases.push( {security : MAM_SECURITY.LEVEL_1, mode : MAM_MODE.RESTRICTED, seed : undefined, sideKey : "999ABC", msg: "Hello World!"} );
/**
 * We're looping through the Masked Authenticated messaging mode's: Public, Private & Restricted.
 * For each of these mode's we will test the: Create, Attach & Fetch.
 */

//https://nodes.devnet.thetangle.org:443
//https://testnet140.tangle.works

 // Filter out the none numbers out of the for loop.
for( let Case of TestCases){
    // Set the security by comparing the current Mam mode (public = 0, private = 1, restricted = 2).
    let writerChannel : MamWriter = new MamWriter('https://wallet1.iota.town:443',undefined, Case.security);
    writerChannel.changeMode(Case.mode, Case.sideKey);
    let Firstroot = writerChannel.getNextRoot();
    let fetchSingleReader : MamReader = new MamReader('https://wallet1.iota.town:443', writerChannel.getNextRoot());
    let fetchAllReader : MamReader = new MamReader('https://nodes.iota.fm:443', writerChannel.getNextRoot());
    //let listener : MamListener = new MamListener('https://testnet140.tangle.works');
    let listenerResult : string[] = [];
    let listenerCounter = 0;
    /*listener.Subscribe(ListenerLoop, (messages : string[]) => {
        listenerCounter++;
        listenerResult.concat(messages);
        console.log("Subscription Found a thing: ");
        console.log(messages);
    }, writerChannel.getNextRoot(), Case.mode, Case.sideKey);*/

    //Expected Messages for the queueing messages
    let ExpectedMessages : string[] = [];
    for(let i=0; i < TestCases.length; i++) {
        //Add message to the queue
        if(TestCases[i].seed == Case.seed) {
            ExpectedMessages.push(TestCases[i].msg);
        }

        //Break if we are the same test
        if(TestCases[i] == Case) {
            break;
        }
    }
    
    //State variables
    let trytes : string | null = null;
    let root : string | null = null;
    let address : string | null = null;
    let payload : string = "";


    //Mam create
    test.serial('MAM Create, mode ' + Case.mode, t => {
        //Assertion plans ensure tests only pass when a specific number of assertions have been executed.
        let createResult = writerChannel.create(Case.msg);

        //Update state
        trytes = createResult.payload;
        root = createResult.root;
        address = createResult.address;
        console.log("Root");
        console.log(root);
        console.log("Address:");
        console.log(address);

        //Assertion 1: Compare if the object we receive is not equal to the previous set variables.
        t.not(createResult, {payload: trytes, root: root, address: address},  "We received a new MaM");
    })

    //Mam attach
    test.serial('MAM Attach, mode ' + Case.mode, async t => {
        let attach = await writerChannel.attach(trytes, address, undefined, 14);
        attach.forEach(element => {
            payload += element.signatureMessageFragment;
        });
        let test = Decode(payload, Case.sideKey, root);
        let test2 = Decode(trytes, Case.sideKey, root);
        t.deepEqual(test.message, test2.message);
    })

    //Fetch Single
    test.serial('MAM singleFetch, mode ' + Case.mode, async t => {
        let fetch = await fetchSingleReader.fetchSingle();
        t.plan(2);
        t.deepEqual(root, Firstroot);
        t.deepEqual(fetch, Case.msg );
    });

    //Fetch All
    test.serial('MAM fetchAll, mode ' + Case.mode, async t => {
        let fetch = await fetchAllReader.fetch();
        
        //Need all to match
        t.plan(ExpectedMessages.length);
        for(let i=0; i < ExpectedMessages.length; i++) {
            t.deepEqual(fetch[i], ExpectedMessages[i]);
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