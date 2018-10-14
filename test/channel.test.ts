import test from 'ava'
import { MamWriter } from '../src/index';

test('MAM Channel creation, sending and receiving transactions', async t => {
    let Channel : MamWriter = new MamWriter('https://testnet140.tangle.works');
    let create = await Channel.createAndAttach("Hello World");
});