import test from 'ava'
import { MamWriter, MamReader, MAM_MODE } from '../src/index';

/**
 * We're going to test the following functions of this MAM Library:
 * MaMWriter:
 * Create
 * Attach
 * 
 * MaMReader:
 * FetchSingle
 * Fetch
 * 
 */
let trytes;
let root;
let adress;
let side_key : string | null;
export default function mamChangeMode(currentMode) {
    let Channel : MamWriter = new MamWriter('https://testnet140.tangle.works');
	if(currentMode === MAM_MODE.RESTRICTED){
        return Channel.changeMode(MAM_MODE.RESTRICTED, side_key);
    }
    return Channel.changeMode(currentMode);
};

for(let item in MAM_MODE){

test.before('MAM Create, mode ' + item, async t => {
    let Channel : MamWriter = new MamWriter('https://testnet140.tangle.works');
    console.log("We are now Creating a " + item +" MAM!")

    //change Masked Authenticated Messaging mode (public, private, restricted)
    mamChangeMode(MAM_MODE[item.toString()])
    let create = await Channel.create("it's a me, Test IoT");

    trytes = create.payload;
    root = create.root;
    adress = create.address;

    console.log(item + " create complete!")
})

test('MAM Attach, mode ' + item, async t => {
    let Channel : MamWriter = new MamWriter('https://testnet140.tangle.works');
    console.log("We are now Attaching!")
    let attach = await Channel.attach(trytes,root);
    console.log(item + "attach complete!")
})


test('MAM Fetch ' + item, async t => {
    let Channel : MamReader = new MamReader('https://testnet140.tangle.works', root);
    console.log("We are now fetching " + item)
    let fetch = await Channel.fetchSingle();
    console.log(item + " fetch complete!")
    console.log("payload: " + fetch.payload + " next root:" + fetch.nextRoot);
})
}
