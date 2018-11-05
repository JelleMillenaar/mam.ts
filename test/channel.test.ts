import test from 'ava'
import { MAM_MODE, MamWriter, MamReader, Decode } from '../src/index';
import { Transaction, Transfer } from '@iota/core/typings/types';
import * as converter from '@iota/converter';

//Variables
let Network = 'https://testnet140.tangle.works';
let Security = 1;
let Mode = MAM_MODE.PRIVATE;
let SideKey = undefined;
let Seed = "9A".repeat(40) + "F";
let Msg = "Hello World".repeat(5);

test('Send & Receive Public MAM Transaction', async t => {
    let Channel : MamWriter = new MamWriter(Network, Seed, Security);
    Channel.changeMode(Mode, SideKey);
    //NEW
    let PreviousRoots : string[] = await Channel.catchUpThroughNetwork();
    console.log("Previous Message Roots: " + PreviousRoots.length);
    for(let i=0; i < PreviousRoots.length; i++) {
        console.log(PreviousRoots[i]);
    }
    //END NEW
    let Root = Channel.getNextRoot();
    //console.log("ROOT");
    //console.log(Root);
    let create = Channel.create(Msg);
    console.log("Created Tx: ");
    console.log(create);
    let Attach = await Channel.attach(create.payload, create.address);
    //console.log("Attached: ");
    //for(let i=0; i < Attach.length; i++) {
    //    console.log(Attach[i].signatureMessageFragment);
    //}
    let Receiver : MamReader = new MamReader(Network, Root, Mode, SideKey);
    let Result = await Receiver.fetchSingle();
    console.log("Result: ");
    console.log(Result);
});
