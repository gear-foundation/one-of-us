import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import { EthereumClient } from '@vara-eth/api';
import {
  PRIVATE_KEY,
  ROUTER_ADDRESS,
  ETH_RPC,
  CODE_ID,
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
  console.log(ETH_RPC)
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

  const ethereumClient = new EthereumClient(
    publicClient,
    walletClient,
    ROUTER_ADDRESS
  );
  await ethereumClient.isInitialized;
  const router = ethereumClient.router;

  console.log('\nCreating program...');
  console.log('Code ID:', CODE_ID);

  if (!CODE_ID) {
    console.error('Error: CODE_ID not set in .env');
    process.exit(1);
  }

  const tx = await router.createProgram(CODE_ID);
  const receipt = await tx.sendAndWaitForReceipt();

  console.log('\n=== Transaction Receipt ===');
  console.log('Hash:', receipt.transactionHash);
  console.log('Block:', receipt.blockNumber);
  console.log(
    'Status:',
    receipt.status === 'success' ? '✅ Success' : '❌ Failed'
  );
  console.log('Gas Used:', receipt.gasUsed.toString());
  console.log('From:', receipt.from);
  console.log('To (Router):', receipt.to);

  const programId = await tx.getProgramId();
  console.log('\n=== Program Created ===');
  console.log('Program ID:', programId);

  console.log('\n✓ Done! Add to .env: PROGRAM_ID=' + programId);
  console.log('Next: npm run fund → npm run init → npm run classic');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
