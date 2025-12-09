import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import { EthereumClient } from '@vara-eth/api';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  PRIVATE_KEY,
  ROUTER_ADDRESS,
  ETH_RPC,
  CODE_ID,
  HOODI_CHAIN_ID,
} from './config.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

function deployWithForge(): string {
  console.log('\n=== Step 1: Deploy & Verify with Foundry ===');

  const etherscanKey = process.env.ETHERSCAN_API_KEY;
  const verifyFlag = etherscanKey
    ? `--verify --etherscan-api-key ${etherscanKey}`
    : '';

  const output = execSync(
    `forge script deploy/DeployOneOfUsAbi.s.sol:DeployOneOfUsAbi \
      --rpc-url ${ETH_RPC} \
      --broadcast ${verifyFlag} -vvv`,
    {
      cwd: join(__dirname, '..'),
      encoding: 'utf-8',
      env: { ...process.env, PRIVATE_KEY: PRIVATE_KEY },
    }
  );

  console.log(output);

  const match = output.match(/deployed at:\s*(0x[a-fA-F0-9]{40})/i);
  if (!match) throw new Error('Could not parse contract address');

  console.log('✅ Deployed:', match[1]);
  return match[1];
}

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

  console.log(
    'Balance:',
    (
      Number(await publicClient.getBalance({ address: account.address })) / 1e18
    ).toFixed(4),
    'ETH'
  );

  if (!CODE_ID) {
    console.error('CODE_ID not set. Run "npm run upload" first.');
    process.exit(1);
  }

  const abiAddress = deployWithForge();

  console.log('\n=== Step 2: Create Program ===');
  console.log('Code ID:', CODE_ID);
  console.log('ABI Address:', abiAddress);

  console.log('Initializing client...');
  const ethereumClient = new EthereumClient(
    publicClient,
    walletClient,
    ROUTER_ADDRESS
  );
  await ethereumClient.isInitialized;

  console.log('Sending transaction...');
  const tx = await ethereumClient.router.createProgramWithAbiInterface(
    CODE_ID,
    abiAddress as `0x${string}`
  );
  const receipt = await tx.sendAndWaitForReceipt();

  console.log('TX:', receipt.transactionHash);
  console.log(
    'Status:',
    receipt.status === 'success' ? '✅ Success' : '❌ Failed'
  );

  if (receipt.status !== 'success') {
    console.error('❌ Failed:', receipt.transactionHash);
    process.exit(1);
  }

  const programId = await tx.getProgramId();
  console.log('\n✅ Done!');
  console.log('PROGRAM_ID=' + programId);
  console.log('ABI_ADDRESS=' + abiAddress);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
