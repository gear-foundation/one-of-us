import { readFileSync } from 'fs';
import { createPublicClient, createWalletClient, http, webSocket } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import { EthereumClient, getMirrorClient } from '@vara-eth/api';
import { walletClientToSigner } from '@vara-eth/api/signer';
import { Sails } from 'sails-js';
import { SailsIdlParser } from 'sails-js-parser';
import {
  PRIVATE_KEY,
  ROUTER_ADDRESS,
  ETH_RPC,
  ETH_RPC_WS,
  PROGRAM_ID,
  CHAIN_ID,
  CHAIN_NAME,
  IDL_PATH,
} from './config.ts';

const hoodi = defineChain({
  id: CHAIN_ID,
  name: CHAIN_NAME,
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
  console.log('Program:', PROGRAM_ID);

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

  const signer = walletClientToSigner(walletClient);
  const ethereumClient = new EthereumClient(
    publicClient,
    ROUTER_ADDRESS,
    signer
  );
  await ethereumClient.waitForInitialization();
  const mirror = getMirrorClient({ address: PROGRAM_ID, publicClient, signer });

  // Initialize Sails from program IDL
  const idlContent = readFileSync(IDL_PATH, 'utf-8');
  const parser = await SailsIdlParser.new();
  const sails = new Sails(parser);
  await sails.parseIdl(idlContent);

  // Encode a regular call using ABI/IDL
  const payload = sails.services.OneOfUs.functions.JoinUs.encodePayload();
  console.log('Payload:', '0x' + Buffer.from(payload).toString('hex'));

  // Send through Ethereum to Mirror
  console.log('\nSending classic transaction...');
  const tx = await mirror.sendMessage(payload, 0n);
  await tx.send();

  // Wait for the program reply
  console.log('Setting up reply listener...');
  const { waitForReply } = await tx.setupReplyListener();

  console.log('Waiting for reply...');
  const reply = await waitForReply();

  console.log('Reply received:', reply);
  console.log('Reply code:', reply.replyCode);
  console.log('Reply payload:', reply.payload);

  if (reply.payload === '0x') {
    console.log('\nReply payload is empty.');
    console.log('This means there is nothing to decode.');
    console.log('Check state separately with: npm run state');
    process.exit(0);
  }

  const result = sails.services.OneOfUs.functions.JoinUs.decodeResult(
    reply.payload as `0x${string}`
  );

  console.log('\nDecoded result:', result);
  console.log('Now verify persisted state with: npm run state');

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
