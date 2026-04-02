import { readFileSync } from 'fs';
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  encodeFunctionData,
  keccak256,
  toBlobs,
  bytesToHex,
  hexToBytes,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { loadKZG } from 'kzg-wasm';
import {
  PRIVATE_KEY,
  ROUTER_ADDRESS,
  ETH_RPC,
  WASM_PATH,
  CHAIN_ID,
  CHAIN_NAME,
  CHAIN_NETWORK_NAME,
} from './config.ts';

const ROUTER_ABI = [
  {
    type: 'function',
    name: 'requestCodeValidation',
    inputs: [{ name: 'codeId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'CodeGotValidated',
    inputs: [
      { name: 'codeId', type: 'bytes32', indexed: false },
      { name: 'valid', type: 'bool', indexed: true },
    ],
  },
] as const;

const hoodi = defineChain({
  id: CHAIN_ID,
  name: CHAIN_NAME,
  network: CHAIN_NETWORK_NAME,
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: {
    default: { http: [ETH_RPC] },
    public: { http: [ETH_RPC] },
  },
});

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log('Account:', account.address);

  const publicClient = createPublicClient({
    chain: hoodi,
    transport: http(ETH_RPC),
  });

  const walletClient = createWalletClient({
    account,
    chain: hoodi,
    transport: http(ETH_RPC),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Balance:', (Number(balance) / 1e18).toFixed(4), 'ETH');

  if (balance === 0n) {
    console.error('Error: No ETH balance');
    process.exit(1);
  }

  console.log('\nReading WASM file...');
  const wasmCode = readFileSync(WASM_PATH);
  console.log('WASM size:', wasmCode.length, 'bytes');

  const codeBytes = new Uint8Array(wasmCode);
  const codeId = keccak256(codeBytes) as `0x${string}`;
  console.log('Code ID:', codeId);

  console.log('\nLoading KZG...');
  const kzgRaw = await loadKZG();
  const kzg = {
    blobToKzgCommitment: (blob: Uint8Array) => {
      const blobHex = bytesToHex(blob) as `0x${string}`;
      const commitmentHex = kzgRaw.blobToKzgCommitment(blobHex) as `0x${string}`;
      return hexToBytes(commitmentHex);
    },
    computeBlobKzgProof: (blob: Uint8Array, commitment: Uint8Array) => {
      const blobHex = bytesToHex(blob) as `0x${string}`;
      const commitmentHex = bytesToHex(commitment) as `0x${string}`;
      const proofHex = kzgRaw.computeBlobKZGProof(blobHex, commitmentHex) as `0x${string}`;
      return hexToBytes(proofHex);
    },
  } as any;

  console.log('\nPreparing blob transaction...');
  const blobs = toBlobs({ data: codeBytes });
  console.log('Blobs count:', blobs.length);

  const blobBaseFee = await publicClient.getBlobBaseFee();
  const maxFeePerBlobGas = blobBaseFee * 2n;

  const callData = encodeFunctionData({
    abi: ROUTER_ABI,
    functionName: 'requestCodeValidation',
    args: [codeId],
  });

  console.log('\nRequesting code validation (blob tx)...');
  console.log('This may take several minutes...');

  const txHash = await walletClient.sendTransaction({
    to: ROUTER_ADDRESS,
    data: callData,
    blobs,
    kzg,
    maxFeePerBlobGas,
  });

  console.log('Transaction sent:', txHash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log('✓ Transaction confirmed:', receipt.transactionHash);
  console.log('Block:', receipt.blockNumber);

  console.log('\nWaiting for CodeGotValidated event...');

  const validated = await new Promise<boolean>((resolve, reject) => {
    const timeout = setTimeout(() => {
      unwatch();
      reject(new Error('Timeout waiting for CodeGotValidated event'));
    }, 10 * 60 * 1000);

    const unwatch = publicClient.watchContractEvent({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      eventName: 'CodeGotValidated',
      onLogs: (logs) => {
        for (const log of logs) {
          if ((log.args as any).codeId?.toLowerCase() === codeId.toLowerCase()) {
            clearTimeout(timeout);
            unwatch();
            resolve((log.args as any).valid === true);
          }
        }
      },
      onError: (err) => {
        clearTimeout(timeout);
        unwatch();
        reject(err);
      },
    });
  });

  if (!validated) {
    throw new Error('Code validation failed');
  }

  console.log('\n✓ Code validated');
  console.log('Code ID:', codeId);
  console.log('\nAdd to .env: CODE_ID=' + codeId);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
