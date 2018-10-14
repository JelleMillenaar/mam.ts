"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IOTA = require('./IOTA.js');
var Main = require('./index.js');
//////////////////////////////////////////////////////////////////
/* ======= CTrits bindings ======= */
var TritEncoding = {
    BYTE: 1,
    TRIT: 2,
    TRYTE: 3
};
/* ======= Rust bindings ======= */
var iota_ctrits_drop = IOTA.cwrap('iota_ctrits_drop', '', ['number']);
var iota_ctrits_convert = IOTA.cwrap('iota_ctrits_convert', 'number', [
    'number',
    'number'
]);
var iota_ctrits_ctrits_from_trytes = IOTA.cwrap('iota_ctrits_ctrits_from_trytes', 'number', ['string', 'number']);
var iota_ctrits_ctrits_from_bytes = IOTA.cwrap('iota_ctrits_ctrits_from_bytes', 'number', ['number', 'number']);
var iota_ctrits_ctrits_from_trits = IOTA.cwrap('iota_ctrits_ctrits_from_trits', 'number', ['number', 'number']);
// For accessing the struct members
var iota_ctrits_ctrits_encoding = IOTA.cwrap('iota_ctrits_ctrits_encoding', 'number', ['number']);
var iota_ctrits_ctrits_length = IOTA.cwrap('iota_ctrits_ctrits_length', 'number', ['number']);
var iota_ctrits_ctrits_data = IOTA.cwrap('iota_ctrits_ctrits_data', 'number', ['number']);
var iota_ctrits_ctrits_byte_length = IOTA.cwrap('iota_ctrits_ctrits_byte_length', 'number', ['number']);
var iota_mam_id = IOTA.cwrap('iota_mam_id', 'number', [
    'number',
    'number'
]);
// (seed, message, key, root, siblings, next_root, start, index, security) -> encoded_message
var iota_mam_create = IOTA.cwrap('iota_mam_create', 'number', [
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
    'number'
]);
// (encoded_message, key, root, index) -> message
var iota_mam_parse = IOTA.cwrap('iota_mam_parse', 'number', [
    'number',
    'number',
    'number',
    'number'
]);
// (seed, index, count, securit) -> MerkleTree instance
var iota_merkle_create = IOTA.cwrap('iota_merkle_create', 'number', [
    'number',
    'number',
    'number',
    'number'
]);
// (MerkleTree instance) -> ()
var iota_merkle_drop = IOTA.cwrap('iota_merkle_drop', '', ['number']);
// (MerkleTree instance) -> (siblings as number)
var iota_merkle_siblings = IOTA.cwrap('iota_merkle_siblings', 'number', [
    'number'
]);
// (MerkleTree instance, index) -> (MerkleBranch instance)
var iota_merkle_branch = IOTA.cwrap('iota_merkle_branch', 'number', [
    'number',
    'number'
]);
// (MerkleBranch instance) -> ()
var iota_merkle_branch_drop = IOTA.cwrap('iota_merkle_branch_drop', '', [
    'number'
]);
// (MerkleBranch instance) -> (number)
var iota_merkle_branch_len = IOTA.cwrap('iota_merkle_branch_len', '', [
    'number'
]);
// (address, siblings, index) -> (root as number)
var iota_merkle_root = IOTA.cwrap('iota_merkle_root', 'number', [
    'number',
    'number',
    'number'
]);
// (MerkleTree instance) -> root hash
var iota_merkle_slice = IOTA.cwrap('iota_merkle_slice', 'number', ['number']);
var string_to_ctrits_trits = function (str) {
    var strin = iota_ctrits_ctrits_from_trytes(str, str.length);
    var out = iota_ctrits_convert(strin, TritEncoding.TRIT);
    iota_ctrits_drop(strin);
    return out;
};
var ctrits_trits_to_string = function (ctrits) {
    var str_trits = iota_ctrits_convert(ctrits, TritEncoding.TRYTE);
    var ptr = iota_ctrits_ctrits_data(str_trits);
    var len = iota_ctrits_ctrits_length(str_trits);
    var out = IOTA.Pointer_stringify(ptr, len);
    iota_ctrits_drop(str_trits);
    return out;
};
var getMamRoot = function (SEED, CHANNEL) {
    var SEED_trits = string_to_ctrits_trits(SEED);
    var root_merkle = iota_merkle_create(SEED_trits, CHANNEL.start, CHANNEL.count, CHANNEL.security);
    return ctrits_trits_to_string(iota_merkle_slice(root_merkle));
};
var getMamAddress = function (KEY, ROOT) {
    var KEY_trits = string_to_ctrits_trits(KEY);
    var ROOT_trits = string_to_ctrits_trits(ROOT);
    var address = iota_mam_id(KEY_trits, ROOT_trits);
    return ctrits_trits_to_string(address);
};
var createMessage = function (SEED, MESSAGE, SIDE_KEY, CHANNEL) {
    if (!SIDE_KEY)
        SIDE_KEY = '999999999999999999999999999999999999999999999999999999999999999999999999999999999';
    // MAM settings
    var SEED_trits = string_to_ctrits_trits(SEED);
    var MESSAGE_trits = string_to_ctrits_trits(MESSAGE);
    var SIDE_KEY_trits = string_to_ctrits_trits(SIDE_KEY);
    var SECURITY = CHANNEL.security;
    var START = CHANNEL.start;
    var COUNT = CHANNEL.count;
    var NEXT_START = START + COUNT;
    var NEXT_COUNT = CHANNEL.next_count;
    var INDEX = CHANNEL.index;
    var HASH_LENGTH = 81;
    // set up merkle tree
    var root_merkle = iota_merkle_create(SEED_trits, START, COUNT, SECURITY);
    var next_root_merkle = iota_merkle_create(SEED_trits, NEXT_START, NEXT_COUNT, SECURITY);
    var root_branch = iota_merkle_branch(root_merkle, INDEX);
    var root_siblings = iota_merkle_siblings(root_branch);
    var next_root_branch = iota_merkle_branch(next_root_merkle, INDEX);
    var root = iota_merkle_slice(root_merkle);
    var next_root = iota_merkle_slice(next_root_merkle);
    var masked_payload = iota_mam_create(SEED_trits, MESSAGE_trits, SIDE_KEY_trits, root, root_siblings, next_root, START, INDEX, SECURITY);
    var response = {
        payload: ctrits_trits_to_string(masked_payload),
        root: ctrits_trits_to_string(root),
        next_root: ctrits_trits_to_string(next_root),
        side_key: SIDE_KEY
    };
    // Clean up memory. Unneccessary for this example script, but should be done when running in a production
    // environment.
    iota_merkle_branch_drop(root_branch);
    iota_merkle_branch_drop(next_root_branch);
    iota_merkle_drop(root_merkle);
    iota_merkle_drop(next_root_merkle);
    [
        SEED_trits,
        MESSAGE_trits,
        SIDE_KEY_trits,
        root,
        next_root,
        masked_payload,
        root_siblings
    ].forEach(iota_ctrits_drop);
    return response;
};
var decodeMessage = function (PAYLOAD, SIDE_KEY, ROOT) {
    if (!SIDE_KEY)
        SIDE_KEY = '999999999999999999999999999999999999999999999999999999999999999999999999999999999';
    var PAYLOAD_trits = string_to_ctrits_trits(PAYLOAD);
    var SIDE_KEY_trits = string_to_ctrits_trits(SIDE_KEY);
    var ROOT_trits = string_to_ctrits_trits(ROOT);
    var parse_result = iota_mam_parse(PAYLOAD_trits, SIDE_KEY_trits, ROOT_trits);
    var unmasked_payload_ctrits = IOTA.getValue(parse_result, 'i32');
    var unmasked_payload = ctrits_trits_to_string(unmasked_payload_ctrits);
    var unmasked_next_root_ctrits = IOTA.getValue(parse_result + 4, 'i32');
    var unmasked_next_root = ctrits_trits_to_string(unmasked_next_root_ctrits);
    [
        PAYLOAD_trits,
        SIDE_KEY_trits,
        ROOT_trits,
        unmasked_payload_ctrits,
        unmasked_next_root_ctrits
    ].forEach(iota_ctrits_drop);
    IOTA._free(parse_result);
    return { payload: unmasked_payload, next_root: unmasked_next_root };
};
exports.Mam = {
    decodeMessage: decodeMessage,
    createMessage: createMessage,
    getMamAddress: getMamAddress,
    getMamRoot: getMamRoot
};
// Feed Mam functions into the main file
//Main.setupEnv(Mam)
// Export
//export = Main;
//# sourceMappingURL=node.js.map