import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import { EthereumClient, getMirrorClient } from '@vara-eth/api';
import {
  PRIVATE_KEY,
  ROUTER_ADDRESS,
  ETH_RPC,
  PROGRAM_ID,
  HOODI_CHAIN_ID,
  WVARA_TOP_UP_AMOUNT,
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
  if (!PROGRAM_ID) {
    console.error('Error: PROGRAM_ID not set in .env');
    process.exit(1);
  }

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

  // v0.0.2: EthereumClient now takes routerAddress and provides wvara client
  const ethereumClient = new EthereumClient(publicClient, walletClient, ROUTER_ADDRESS);
  await ethereumClient.isInitialized;
  const wvara = ethereumClient.wvara;
  const mirror = getMirrorClient(PROGRAM_ID, ethereumClient);

  const wvaraBalance = await wvara.balanceOf(account.address);
  console.log('wVARA balance:', wvaraBalance.toString());

  if (wvaraBalance === 0n) {
    console.error('Error: No wVARA balance');
    console.log('Get wVARA tokens first');
    process.exit(1);
  }

  if (wvaraBalance < WVARA_TOP_UP_AMOUNT) {
    console.error('Error: Insufficient wVARA balance');
    console.log('Required:', WVARA_TOP_UP_AMOUNT.toString());
    console.log('Available:', wvaraBalance.toString());
    process.exit(1);
  }

  console.log(
    '\nFunding program with',
    WVARA_TOP_UP_AMOUNT.toString(),
    'wVARA'
  );

  console.log('Approving wVARA...');
  const approveTx = await wvara.approve(PROGRAM_ID, WVARA_TOP_UP_AMOUNT);
  await approveTx.sendAndWaitForReceipt();

  console.log('Topping up executable balance...');
  const topUpTx = await mirror.executableBalanceTopUp(WVARA_TOP_UP_AMOUNT);
  await topUpTx.sendAndWaitForReceipt();

  console.log(
    '\n✓ Program funded with',
    WVARA_TOP_UP_AMOUNT.toString(),
    'wVARA'
  );
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
