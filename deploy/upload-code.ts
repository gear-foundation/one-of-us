import { readFileSync } from 'fs';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import { EthereumClient } from '@vara-eth/api';
import {
  PRIVATE_KEY,
  ROUTER_ADDRESS,
  ETH_RPC,
  WASM_PATH,
  HOODI_CHAIN_ID,
} from './config.ts';

const hoodi = defineChain({
  id: HOODI_CHAIN_ID,
  name: 'Hoodi Testnet',
  network: 'hoodi',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: {
    default: { http: [ETH_RPC] },
    public: { http: [ETH_RPC] },
  },
  testnet: true,
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

  const ethereumClient = new EthereumClient(
    publicClient,
    walletClient,
    ROUTER_ADDRESS
  );
  await ethereumClient.isInitialized;
  const router = ethereumClient.router;

  console.log('\nReading WASM file...');
  const wasmCode = readFileSync(WASM_PATH);
  console.log('WASM size:', wasmCode.length, 'bytes');

  console.log('\nRequesting code validation...');
  console.log('This may take several minutes...');
  console.log('(Preparing blob transaction...)\n');

  const codeBytes = new Uint8Array(wasmCode);
  const codeHex = `0x${wasmCode.toString('hex')}` as `0x${string}`;

  // Suppress verbose transaction logging from library
  const originalLog = console.log;
  console.log = () => {};

  const tx = await router.requestCodeValidation(codeBytes);
  const receipt = await tx.sendAndWaitForReceipt();

  console.log = originalLog;

  console.log('✓ Transaction confirmed:', receipt.transactionHash);

  console.log('\nWaiting for validation...');
  const validated = await tx.waitForCodeGotValidated();

  if (!validated) {
    throw new Error('Code validation failed');
  }

  const codeId = (await publicClient.readContract({
    address: ROUTER_ADDRESS,
    abi: [
      {
        inputs: [{ name: 'code', type: 'bytes' }],
        name: 'codeId',
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'pure',
        type: 'function',
      },
    ],
    functionName: 'codeId',
    args: [codeHex],
  })) as `0x${string}`;

  console.log('\n✓ Code validated');
  console.log('Code ID:', codeId);
  console.log('\nAdd to .env: CODE_ID=' + codeId);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
