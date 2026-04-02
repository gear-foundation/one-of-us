import { readFileSync } from 'fs';
import { createPublicClient, createWalletClient, defineChain, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { EthereumClient } from '@vara-eth/api';
import { walletClientToSigner } from '@vara-eth/api/signer';
import {
  PRIVATE_KEY,
  ROUTER_ADDRESS,
  ETH_RPC,
  CHAIN_ID,
  CHAIN_NAME,
  CHAIN_NETWORK_NAME,
  WASM_PATH,
} from './config.ts';

type CodeValidationTx = {
  codeId: `0x${string}`;
  sendAndWaitForReceipt: () => Promise<{ transactionHash: `0x${string}`; status: string }>;
  waitForCodeGotValidated: () => Promise<boolean>;
};

const chain = defineChain({
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
    chain,
    transport: http(ETH_RPC),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(ETH_RPC),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Balance:', (Number(balance) / 1e18).toFixed(6), 'ETH');
  if (balance === 0n) {
    throw new Error('No ETH balance');
  }

  const wasmCode = readFileSync(WASM_PATH);
  const code = new Uint8Array(wasmCode);
  console.log('WASM size:', code.length, 'bytes');

  const ethereumClient = new EthereumClient(
    publicClient,
    ROUTER_ADDRESS,
    walletClientToSigner(walletClient)
  );
  await ethereumClient.waitForInitialization();

  const router = ethereumClient.router as unknown as {
    requestCodeValidation?: (code: Uint8Array) => Promise<CodeValidationTx>;
  };

  if (typeof router.requestCodeValidation !== 'function') {
    throw new Error(
      'requestCodeValidation() is unavailable in current @vara-eth/api. ' +
        'Upgrade to v0.3.1+ (and required @vara-eth/viem) or use npm run upload.'
    );
  }

  let validationTx: CodeValidationTx;
  try {
    validationTx = await router.requestCodeValidation(code);
  } catch (error: any) {
    if (String(error?.message || '').includes('Not implemented')) {
      throw new Error(
        'Current @vara-eth/api exposes requestCodeValidation() but it is not implemented. ' +
          'Upgrade to v0.3.1+ or use npm run upload.'
      );
    }
    throw error;
  }

  console.log('Code ID:', validationTx.codeId);
  console.log('Sending requestCodeValidation transaction...');
  const receipt = await validationTx.sendAndWaitForReceipt();
  console.log('Transaction:', receipt.transactionHash);
  console.log('Status:', receipt.status);

  const waitValidation = process.env.UPLOAD_WAIT_VALIDATION !== 'false';
  if (waitValidation) {
    console.log('Waiting for CodeGotValidated event...');
    const ok = await validationTx.waitForCodeGotValidated();
    if (!ok) {
      throw new Error('Code validation failed');
    }
  }

  console.log('\n✓ Code validated');
  console.log('CODE_ID=' + validationTx.codeId);
}

main().catch((error: any) => {
  console.error('Error:', error?.message || error);
  process.exit(1);
});
