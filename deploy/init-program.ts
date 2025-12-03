import { readFileSync } from 'fs';
import { createPublicClient, createWalletClient, http, webSocket } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import { EthereumClient, getMirrorClient } from '@vara-eth/api';
import { Sails } from 'sails-js';
import { SailsIdlParser } from 'sails-js-parser';
import {
  PRIVATE_KEY,
  ROUTER_ADDRESS,
  ETH_RPC,
  ETH_RPC_WS,
  PROGRAM_ID,
  HOODI_CHAIN_ID,
  IDL_PATH,
} from './config.ts';

const hoodi = defineChain({
  id: HOODI_CHAIN_ID,
  name: 'Hoodi Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [ETH_RPC], webSocket: [ETH_RPC_WS] },
  },
});

async function main() {
  if (!PROGRAM_ID) {
    console.error('Error: PROGRAM_ID not set in .env');
    console.log('Run "npm run create" first to create a program');
    process.exit(1);
  }

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log('Account:', account.address);

  // Use WebSocket for subscriptions (reply listener)
  // Both clients need same transport type for getMirrorClient
  const transport = webSocket(ETH_RPC_WS);

  const publicClient = createPublicClient({
    chain: hoodi,
    transport,
  });

  const walletClient = createWalletClient({
    account,
    chain: hoodi,
    transport,
  });

  const ethereumClient = new EthereumClient(
    publicClient,
    walletClient,
    ROUTER_ADDRESS
  );
  await ethereumClient.isInitialized;
  const mirror = getMirrorClient(PROGRAM_ID, walletClient, publicClient);

  console.log('\nInitializing program...');

  const idlContent = readFileSync(IDL_PATH, 'utf-8');
  const parser = await SailsIdlParser.new();
  const sails = new Sails(parser);
  await sails.parseIdl(idlContent);

  const initPayload = sails.ctors.Init.encodePayload();
  console.log('Init payload:', '0x' + Buffer.from(initPayload).toString('hex'));

  const initTx = await mirror.sendMessage(initPayload, 0n);
  console.log('Sending init message...');
  await initTx.send();

  console.log('Setting up reply listener...');
  const { waitForReply } = await initTx.setupReplyListener();

  console.log('Waiting for reply...');
  const reply = await waitForReply();
  console.log('Reply received:', reply);

  console.log('✓ Program initialized');
  console.log('Next: npm test');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
