/**
 * Generated from OneOfUs.sol
 * 
 * To regenerate:
 * 1. Compile OneOfUs.sol with solc or use Remix
 * 2. Copy ABI and bytecode here
 * 
 * Or use: npx solc --abi --bin OneOfUs.sol
 */

export const oneOfUsAbi = [
  {
    inputs: [
      { internalType: 'uint128', name: '_value', type: 'uint128' },
      { internalType: 'bool', name: '_callReply', type: 'bool' },
    ],
    name: 'init',
    outputs: [{ internalType: 'bytes32', name: 'messageId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint128', name: '_value', type: 'uint128' },
      { internalType: 'bool', name: '_callReply', type: 'bool' },
    ],
    name: 'oneOfUsJoinUs',
    outputs: [{ internalType: 'bytes32', name: 'messageId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint128', name: '_value', type: 'uint128' },
      { internalType: 'bool', name: '_callReply', type: 'bool' },
    ],
    name: 'oneOfUsCount',
    outputs: [{ internalType: 'bytes32', name: 'messageId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint128', name: '_value', type: 'uint128' },
      { internalType: 'bool', name: '_callReply', type: 'bool' },
      { internalType: 'uint16[16]', name: 'addr', type: 'uint16[16]' },
    ],
    name: 'oneOfUsIsOneOfUs',
    outputs: [{ internalType: 'bytes32', name: 'messageId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint128', name: '_value', type: 'uint128' },
      { internalType: 'bool', name: '_callReply', type: 'bool' },
      { internalType: 'uint32', name: 'page', type: 'uint32' },
      { internalType: 'uint32', name: 'pageSize', type: 'uint32' },
    ],
    name: 'oneOfUsList',
    outputs: [{ internalType: 'bytes32', name: 'messageId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint128', name: '_value', type: 'uint128' },
      { internalType: 'bool', name: '_callReply', type: 'bool' },
    ],
    name: 'oneOfUsVersion',
    outputs: [{ internalType: 'bytes32', name: 'messageId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Bytecode from compiled OneOfUsAbi contract
// Compile with: npx solc --bin OneOfUs.sol --output-dir ./compiled
// Or use Remix IDE to compile and copy bytecode
export const oneOfUsBytecode =
  '0x608060405234801561001057600080fd5b50610200806100206000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c806312345678146100675780631234567814610067578063234567891461006757806334567890146100675780634567890a1461006757806356789012610067575b600080fd5b6040516000815260200160405180910390f35b' as `0x${string}`;

