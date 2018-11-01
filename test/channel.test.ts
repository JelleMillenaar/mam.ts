import test from 'ava'
import { MAM_MODE, MamWriter, MamReader, Decode } from '../src/index';
import { Transaction, Transfer } from '@iota/core/typings/types';
import * as converter from '@iota/converter';

const NULL_HASH = '9'.repeat(81);
const tag = 'TAG' + '9'.repeat(24);

//Variables
let Network = 'https://testnet140.tangle.works';
let Security = 1;
let Mode = MAM_MODE.PUBLIC;
let SideKey = undefined;
let Seed = undefined;
let Msg = "Hello World".repeat(5);

test('Send & Receive Public MAM Transaction', async t => {
    let Channel : MamWriter = new MamWriter(Network, Seed, Security);
    Channel.changeMode(Mode, SideKey);
    let Root = Channel.getNextRoot();
    let create = Channel.create(Msg);
    let Attach = await Channel.attach(create.payload, Root);
    let Receiver : MamReader = new MamReader(Network, Root, Mode, SideKey);
    let Result = await Receiver.fetchSingle();
    t.deepEqual(Msg, Result.message);
});

