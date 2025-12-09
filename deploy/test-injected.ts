import { readFileSync } from 'fs';
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { EthereumClient, VaraEthApi, WsVaraEthProvider } from '@vara-eth/api';
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

async function main() {
  const chain = defineChain({
    id: HOODI_CHAIN_ID,
    name: 'Hoodi',
    network: 'hoodi',
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    rpcUrls: { default: { http: [ETH_RPC] } },
    testnet: true,
  });

  const account = privateKeyToAccount(PRIVATE_KEY);
  const publicClient = createPublicClient({ chain, transport: http(ETH_RPC) });
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(ETH_RPC),
  });

  const ethereumClient = new EthereumClient(
    publicClient,
    walletClient,
    ROUTER_ADDRESS
  );
  await ethereumClient.isInitialized;

  console.log('Account:', account.address);
  console.log('Program:', PROGRAM_ID);

  const provider = new WsVaraEthProvider(
    VARA_ETH_WS as `ws://${string}` | `wss://${string}`
  );
  const api = new VaraEthApi(provider, ethereumClient);

  // Connect WebSocket provider
  await provider.connect();

  const parser = await SailsIdlParser.new();
  const sails = new Sails(parser);
  const idl = readFileSync(IDL_PATH, 'utf-8');
  await sails.parseIdl(idl);

  const payload = sails.services.OneOfUs.functions.JoinUs.encodePayload();
  console.log('Payload:', '0x' + Buffer.from(payload).toString('hex'));

  // v0.0.2: InjectedTransaction class removed, pass params directly
  const injected = await api.createInjectedTransaction({
    destination: PROGRAM_ID as `0x${string}`,
    payload: payload as `0x${string}`,
    value: 0n,
  });

  console.log('Sending...');
  const result = await injected.sendAndWaitForPromise();
  console.log('Done!', result);

  await api.provider.disconnect?.();
}

main().catch(console.error);
