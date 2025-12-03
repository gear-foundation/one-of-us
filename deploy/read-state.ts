import { readFileSync } from 'fs';
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  EthereumClient,
  VaraEthApi,
  WsVaraEthProvider,
  getMirrorClient,
} from '@vara-eth/api';
import { Sails } from 'sails-js';
import { SailsIdlParser } from 'sails-js-parser';
import {
  PRIVATE_KEY,
  ETH_RPC,
  VARA_ETH_WS,
  ROUTER_ADDRESS,
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

  // Connect to Vara.eth API
  const api = new VaraEthApi(
    new WsVaraEthProvider(VARA_ETH_WS as `ws://${string}` | `wss://${string}`),
    ethereumClient,
    ROUTER_ADDRESS
  );

  // Get the current state hash from Ethereum (Mirror contract)
  const stateHash = await mirror.stateHash();
  console.log('State hash:', stateHash);

  // Initialize Sails from program IDL
  const idlContent = readFileSync(IDL_PATH, 'utf-8');
  const parser = await SailsIdlParser.new();
  const sails = new Sails(parser);
  await sails.parseIdl(idlContent);

  // Query: How many builders joined?
  const countPayload = sails.services.OneOfUs.queries.Count.encodePayload();
  console.log('\nQuerying builders count...');

  const countReply = await api.call.program.calculateReplyForHandle(
    account.address,
    PROGRAM_ID,
    countPayload
  );

  const count = sails.services.OneOfUs.queries.Count.decodeResult(
    countReply.payload
  );
  console.log('Builders count:', count);

  // Query: Who are the builders?
  const buildersPayload =
    sails.services.OneOfUs.queries.Builders.encodePayload();
  console.log('\nQuerying builders list...');

  const buildersReply = await api.call.program.calculateReplyForHandle(
    account.address,
    PROGRAM_ID,
    buildersPayload
  );

  const builders = sails.services.OneOfUs.queries.Builders.decodeResult(
    buildersReply.payload
  );
  console.log('Builders list:', builders);

  await api.provider.disconnect?.();
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
