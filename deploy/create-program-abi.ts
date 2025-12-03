import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import { EthereumClient, getRouterClient } from '@vara-eth/api';
import {
  PRIVATE_KEY,
  ROUTER_ADDRESS,
  ETH_RPC,
  CODE_ID,
  HOODI_CHAIN_ID,
} from './config.ts';

// Import generated Solidity ABI contract
// Note: You need to compile OneOfUs.sol first to get ABI and bytecode
import { oneOfUsAbi, oneOfUsBytecode } from './OneOfUsAbi.ts';

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

  if (!CODE_ID) {
    console.error('Error: CODE_ID not set in .env');
    console.log('Run "npm run upload" first to upload code');
    process.exit(1);
  }

  const ethereumClient = new EthereumClient(publicClient, walletClient);
  const router = getRouterClient(ROUTER_ADDRESS, ethereumClient);

  // Step 1: Deploy Solidity ABI contract
  console.log('\n=== Step 1: Deploy Solidity ABI Contract ===');
  console.log('Deploying OneOfUsAbi contract...');

  const deployHash = await walletClient.deployContract({
    abi: oneOfUsAbi,
    bytecode: oneOfUsBytecode,
    account,
  });

  console.log('Deploy TX:', deployHash);

  const deployReceipt = await publicClient.waitForTransactionReceipt({
    hash: deployHash,
  });

  const abiAddress = deployReceipt.contractAddress;
  console.log('ABI Contract deployed at:', abiAddress);

  if (!abiAddress) {
    console.error('Error: Failed to deploy ABI contract');
    process.exit(1);
  }

  // Step 2: Create program with ABI interface
  console.log('\n=== Step 2: Create Program with ABI Interface ===');
  console.log('Code ID:', CODE_ID);
  console.log('ABI Address:', abiAddress);

  const tx = await router.createProgramWithAbiInterface(CODE_ID, abiAddress);
  const receipt = await tx.sendAndWaitForReceipt();

  console.log('\n=== Transaction Receipt ===');
  console.log('Hash:', receipt.transactionHash);
  console.log('Block:', receipt.blockNumber);
  console.log(
    'Status:',
    receipt.status === 'success' ? '✅ Success' : '❌ Failed'
  );
  console.log('Gas Used:', receipt.gasUsed.toString());

  const programId = await tx.getProgramId();
  console.log('\n=== Program Created with ABI ===');
  console.log('Program ID:', programId);
  console.log('ABI Contract:', abiAddress);

  console.log('\n✓ Done! Add to .env:');
  console.log('  PROGRAM_ID=' + programId);
  console.log('  ABI_ADDRESS=' + abiAddress);
  console.log('\nNext: npm run fund → npm run init');
  console.log('\nYou can now interact with the program using Solidity ABI!');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

