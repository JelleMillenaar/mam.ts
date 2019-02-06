# MAM.ts

This library is based on the MAM Client JS Library from the IOTA Foundation. It has been converted to Typescript in order to work with the latest IOTA.js library (Typescript). It is coupled to the rust implementation of MAM from the IOTA Foundation.

MAM.ts consists of several classes that handle the MAM logic. 
1. **MamWriter**: The writer class that publishes MAM transactions to the IOTA network. 
2. **MamReader**: A reader class that reads MAM transactions from a stream from a given root. Can read per transaction or can catch up on the stream. 
3. **MamListener**: (Under development) A reader class that checks for new MAM transactions at a set interval. 
4. **ZMQListener**: (Future feature) A reader class that has a ZMQ stream connection with a node and listens to all transactions and calls a callback when a MAM transaction is found. 

MAM.ts is still under development and could contain bugs. More features are still planned and can be found in the future updates section. MAM.ts plans to support future updates to Masked Authenticated Messaging from the IOTA Foundation like MAM+ / MAMv2. 

## Masked Authenticated Messaging

It is possible to publish transactions to the Tangle that contain only messages, with no value. This introduces many possibilities for data integrity and communication, but comes with the caveat that message-only signatures are not checked. What we introduce is a method of symmetric-key encrypted, signed data that takes advantage of merkle-tree winternitz signatures for extended public key usability, that can be found trivially by those who know to look for it.

This is wrapper library for the WASM/ASM.js output of the [IOTA Bindings repository](https://github.com/iotaledger/iota-bindings). For a more in depth look at how Masked Authenticated Messaging works please check out the [Overview](https://github.com/l3wi/mam.client.js/blob/master/docs/overview.md)

## Getting Started

TODO: NPM install instruction when published

## MamWriter

### `constructor`

Creates the MamWriter and prepares the object for creation MAM transaction. If the seed is reused, remember to call a catchUp function before starting to publish transactions! This function automatically calls changeMode function with the provided settings.

#### Input

```
 constructor(provider: string, seed : string, mode : MAM_MODE, sideKey : string, security : MAM_SECURITY)
```

1. **provider**: `String` URL:port to the IOTA node that will receive the transactions. Should support PoW.
2. **seed**: `String` Trinary string of 81 characters that makes you owner of the channel. *Defaults to a unsecure random seed if no or an incorrect seed is given.*
3. **mode**: `MAM_MODE` Enumerator for the MAM mode: public, private or restricted. Restricted mode requires a sideKey. *Defaults to public.*
4. **sideKey**: `String` Plaintext sideKey used for MAM_MODE.RESTRICTED. Ignored otherwise. *Default is undefined.*
5. **security**: `MAM_SECURITY` Enumerator for the MAM security: 1, 2 or 3. The security of the transactions, since no value is transfered 1 is recommended, otherwise 2, but 3 is generally considered overkill. *Defaults to MAM_SECURITY.LEVEL_1.*

#### Return

The created MamWriter object.

------

### `changeMode`

Changes the settings of the MamWriter. This function is also called y the constructor with the provided settings. When the mode is changed it also switches stream. If the same seed & mode combination has been used before, it is recommended to run a CatchUp function before Attaching any new messages to make sure they are correctly appended on the end of the stream. 

#### Input

public changeMode(mode : MAM_MODE, sideKey ?: string, security : MAM_SECURITY)

1. **mode**: `MAM_MODE` Enumerator for the MAM mode: public, private or restricted. Restricted mode requires a sideKey.
2. **sideKey**: `String` Plaintext sideKey used for MAM_MODE.RESTRICTED. Ignored otherwise. *Default is undefined.*
3. **security**: `MAM_SECURITY` Enumerator for the MAM security: 1, 2 or 3. The security of the transactions, since no value is transfered 1 is recommended, otherwise 2, but 3 is generally considered overkill. *Defaults to MAM_SECURITY.LEVEL_1.*

#### Return

void

------

/**
     * Useful to call after a MamWriter is created and the input seed has been previously used. 
     * This function makes sure that the next message that is added to the MAM stream is appended at the end of the MAM stream.
     * It is required that the entire MAM stream of this seed + mode is avaliable by the given node.
     * @returns An array of the previous roots of all messages used in the stream so far.
     */
    public async catchUpThroughNetwork() : Promise<string[]>

### `catchUpThroughNetwork` - async

Updates the MamWriter to make sure it adds the new MAM stream transactions at the end of the stream. This function iterates through the roots of the channel until an unused root is found. The previous MAM transactions need to be avaliable on the connect node (not snapshotted away), otherwise the end of the stream cannot be found. It is recommended to run this function after the creation of a MAMWriter while reusing a seed, or after calling changeMode when reusing the seed. 

#### Input

public async catchUpThroughNetwork()

#### Return

1. **Promise<string[]>** An array of all the previously used roots of the MAM stream using the current settings. All these roots are no longer used for writing, but can be used for reading.

------


This initialises the state. This will return a state object that tracks the progress of your stream and streams you are following


## API Reference



## Building `IOTA.js`

1. Install Rust

```
curl https://sh.rustup.rs -sSf | sh
```
See https://www.rustup.rs/

2. Update to `nightly`

```
rustup default nightly
rustup update
```

3. Install `Emscripten`

```
cd
# Get the emsdk repo
git clone https://github.com/juj/emsdk.git

# Enter that directory
cd emsdk

# Fetch the latest registry of available tools.
./emsdk update

# Download and install the latest SDK tools.
./emsdk install latest

# Make the "latest" SDK "active" for the current user. (writes ~/.emscripten file)
./emsdk activate latest

# Activate PATH and other environment variables in the current terminal
source ./emsdk_env.sh
```

See https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html


4. Clone latest `iota-bindings` Repo, then compile content of the `emscripten` to `IOTA.js`
```
git clone git@github.com:iotaledger/iota-bindings.git
cd iota-bindings/emscripten
rustup target install asmjs-unknown-emscripten
cargo build --release --target asmjs-unknown-emscripten
```

5. Navigate to `iota-bindings/emscripten/target/asmjs-unknown-emscripten/release` and look for `IOTA.js`

6. Add `module.exports = Module;` at the very end of `IOTA.js` file
