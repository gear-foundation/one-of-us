import { readFileSync } from 'fs';
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { WsVaraEthProvider, createVaraEthApi } from '@vara-eth/api';
import { walletClientToSigner } from '@vara-eth/api/signer';
import { Sails } from 'sails-js';
import { SailsIdlParser } from 'sails-js-parser';
import {
  PRIVATE_KEY,
  ETH_RPC,
  VARA_ETH_WS,
  ROUTER_ADDRESS,
  PROGRAM_ID,
  CHAIN_ID,
  CHAIN_NAME,
  CHAIN_NETWORK_NAME,
  IDL_PATH,
} from './config.ts';

async function main() {
  const chain = defineChain({
    id: CHAIN_ID,
    name: CHAIN_NAME,
    network: CHAIN_NETWORK_NAME,
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    rpcUrls: { default: { http: [ETH_RPC] } },
  });

  const account = privateKeyToAccount(PRIVATE_KEY);
  const publicClient = createPublicClient({ chain, transport: http(ETH_RPC) });
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(ETH_RPC),
  });

  console.log('Account:', account.address);
  console.log('Program:', PROGRAM_ID);

  const provider = new WsVaraEthProvider(
    VARA_ETH_WS as `ws://${string}` | `wss://${string}`
  );
  const api = await createVaraEthApi(
    provider,
    publicClient,
    ROUTER_ADDRESS,
    walletClientToSigner(walletClient)
  );

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

  console.log('Sending injected transaction...');
  const promise = await injected.sendAndWaitForPromise();

  console.log('Raw injected response:', promise);

  await promise.validateSignature();
  console.log('Signature is valid');

  console.log('Reply code:', promise.code);
  console.log('Reply payload:', promise.payload);

  if (promise.payload === '0x') {
    console.log('Empty payload, nothing to decode');
    console.log('State may appear later on L1. Check with: npm run state');
    await api.provider.disconnect?.();
    process.exit(0);
  }

  const result = sails.services.OneOfUs.functions.JoinUs.decodeResult(
    promise.payload as `0x${string}`
  );

  console.log('Decoded result:', result);
  console.log('Note: injected gives pre-confirmation first, state may appear later.');
  console.log('Check with: npm run state');

  await api.provider.disconnect?.();
  process.exit(0);
}

main().catch(console.error);
