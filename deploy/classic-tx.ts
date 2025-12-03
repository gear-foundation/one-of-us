import { readFileSync } from 'fs';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import { EthereumClient, getMirrorClient } from '@vara-eth/api';
import { Sails } from 'sails-js';
import { SailsIdlParser } from 'sails-js-parser';
import {
  PRIVATE_KEY,
  ETH_RPC,
  PROGRAM_ID,
  HOODI_CHAIN_ID,
  IDL_PATH,
} from './config.ts';

const hoodi = defineChain({
  id: HOODI_CHAIN_ID,
  name: 'Hoodi Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [ETH_RPC] },
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

  const publicClient = createPublicClient({
    chain: hoodi,
    transport: http(ETH_RPC),
  });

  const walletClient = createWalletClient({
    account,
    chain: hoodi,
    transport: http(ETH_RPC),
  });

  const ethereumClient = new EthereumClient(publicClient, walletClient);
  const mirror = getMirrorClient(PROGRAM_ID, ethereumClient);

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

  // Decode result
  const result = sails.services.OneOfUs.functions.JoinUs.decodeResult(
    reply.payload
  );
  console.log('\n✓ Result:', result);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

