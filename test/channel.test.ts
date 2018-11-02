import test from 'ava'
import { MamWriter, MamReader, MAM_MODE, Decode } from '../src/index';
import { INVALID_TAIL_TRANSACTION } from '@iota/core/typings/errors';
import { stringify } from 'querystring';

let trytes = null;
let root = null;
let adress = null;
let side_key : string | null = "0";
let payload : string = "";

/**
 * We're looping through the Masked Authenticated messaging mode's: Public, Private & Restricted.
 * For each of these mode's we will test the: Create, Attach & Fetch.
 */

 // Filter out the none numbers out of the for loop.s
for(let item in Object.keys(MAM_MODE).filter(key => isNaN(Number(key)))){

    // Set the security by comparing the current Mam mode (public = 0, private = 1, restricted = 2).
    let security = MAM_MODE[MAM_MODE[item]] + 1;
    // Creating default mam writer channel.
    let writerChannel : MamWriter | null = null;
    // Creating default  mam reader channel.
    let readerChannel : MamReader | null = null;
    let Msg = "it's a me, Test IoT";
    
    //Set the mam channels.
    writerChannel = new MamWriter('https://testnet140.tangle.works',undefined, security);
    writerChannel.changeMode(MAM_MODE[item.toString()], side_key);
    readerChannel = new MamReader('https://testnet140.tangle.works', writerChannel.getNextRoot());
    


//Mam create
test.serial('MAM Create, mode ' + MAM_MODE[item].toLowerCase(), t => {
    //Assertion plans ensure tests only pass when a specific number of assertions have been executed.
    t.plan(2)
    t.log("We are now Creating a " + MAM_MODE[item].toLowerCase() +" MAM!")
    let create = writerChannel.create(Msg.repeat(1));

    //Assertion 1: Compare if the object we receive is not equal to the previous set variables.
    t.not(create, {payload: trytes, root: root, address: adress},  "We received a new MaM")
    
    trytes = create.payload;
    root = create.root;
    adress = create.address;
    t.log(root);
    //Assertion 2: Passing assertion.
    t.pass("create complete!")
})

test.serial('MAM Attach, mode ' + MAM_MODE[item].toLowerCase(), async t => {
    t.plan(2)
    t.log("We are now Attaching!")
    if(security == 1){
        let attach = await writerChannel.attach(trytes,root,undefined,12);
    }
    let attach = await writerChannel.attach(trytes,adress,undefined,12);
    t.log(Object.keys(attach).values())
     attach.forEach(element => {
         payload += element.signatureMessageFragment
     });
     t.log("root: " +adress);
     t.log("side key: " +side_key)
    let test = Decode(payload, side_key,adress)
    let test2 = Decode(trytes, side_key,adress)
    t.deepEqual(test.payload, test2.payload)
    
    t.pass(MAM_MODE[item].toLowerCase() + "attach complete!")
})


test.serial('MAM Fetch ' + MAM_MODE[item].toLowerCase(), async t => {
    let Channel : MamReader = new MamReader('https://testnet140.tangle.works', root, MAM_MODE[item.toString()], side_key);
    t.log("We are now fetching " + MAM_MODE[item].toLowerCase())
    let fetch = await Channel.fetchSingle();
    t.log(MAM_MODE[item].toLowerCase() + " fetch complete!")
    t.log("payload: " + fetch.payload + " next root:" + fetch.nextRoot);
    t.deepEqual(Msg, fetch.payload);

})

}
