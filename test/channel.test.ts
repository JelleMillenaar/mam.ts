import test from 'ava'
import { MamWriter, MamReader } from '../src/index';
import { MAM_MODE } from '../src/Settings';
import { Decode } from '../src/Decode';

let trytes : string | null = null;
let root : string | null = null;
let adress : string | null = null;
let side_key : string | null = "0";
let payload : string = "";
let create;

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
    let Msg = "HelloWorld";
    
    //Set the mam channels.
    writerChannel = new MamWriter('https://testnet140.tangle.works',undefined, security);
    writerChannel.changeMode(MAM_MODE[item.toString()], side_key);
    readerChannel = new MamReader('https://testnet140.tangle.works', writerChannel.getNextRoot());
    


//Mam create
test.serial('MAM Create, mode ' + MAM_MODE[item].toLowerCase(), t => {
    //Assertion plans ensure tests only pass when a specific number of assertions have been executed.
    t.plan(2)
    t.log("We are now Creating a " + MAM_MODE[item].toLowerCase() +" MAM!")
    create = writerChannel.create(Msg.repeat(1));

    //Assertion 1: Compare if the object we receive is not equal to the previous set variables.
    t.not(create, {payload: trytes, root: root, address: adress},  "We received a new MaM")
    
    trytes = create.payload;
    root = create.root;
    adress = create.address;
    t.log(adress);
    //Assertion 2: Passing assertion.
    t.pass("create complete!")
})

test.serial('MAM Attach, mode ' + MAM_MODE[item].toLowerCase(), async t => {
    t.log("Trytes: " + trytes)
    t.log("Adress: " + adress)
    t.log("Sidekey: " + side_key )
    t.plan(2)
    t.log("We are now Attaching!")
    let attach = await writerChannel.attach(create.payload, create.address,undefined,12);
     attach.forEach(element => {
         payload += element.signatureMessageFragment
     });
    let test = Decode(payload, side_key,adress)
    let test2 = Decode(trytes, side_key,adress)
    t.deepEqual(test.message, test2.message)
    
    t.pass(MAM_MODE[item].toLowerCase() + "attach complete!")
})

/*
test.serial('MAM Fetch ' + MAM_MODE[item].toLowerCase(), async t => {
    let Channel : MamReader = new MamReader('https://testnet140.tangle.works', root, MAM_MODE[item.toString()], side_key);
    t.log("We are now fetching " + MAM_MODE[item].toLowerCase())
    let fetch = await Channel.fetchSingle();
    t.log(MAM_MODE[item].toLowerCase() + " fetch complete!")
    t.log("payload: " + fetch + " next root:" + fetch);
    t.deepEqual(Msg, fetch);

})
*/
}
