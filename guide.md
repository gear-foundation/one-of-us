# Be **One of Us**. Let's make Ethereum run real programs

> Deploy and run WASM programs on Ethereum through Vara.eth. No L2, no new chains — just Ethereum's security with parallel execution.

## Introduction

In this guide, we'll dive into the process of deploying and running actual WASM programs on Ethereum through Vara.eth. The idea is straightforward: you write your program in Rust, compile it to WASM, and then execute it in a high-performance parallel environment — while keeping Ethereum as the settlement and security layer. No Layer 2, no new chains, no liquidity fragmentation, and no extra trust assumptions. Just Ethereum's security model and liquidity, with a compute layer that finally lets your app breathe.

> 💡 **Pre-confirmations**
>
> Vara.eth also brings a new execution feel to L1 apps: alongside canonical Ethereum finality, programs can return **pre-confirmations** — fast, cryptographically backed acknowledgements from executors that arrive in near real time. That means your users can experience Web2-like responsiveness while still ending up with Ethereum-level settlement security (which opens up a whole new space of application designs that simply weren't practical on sequential L1 execution).

This guide is for developers who want to build Ethereum-native applications but need more than sequential smart-contract execution can realistically offer. We'll stay practical from the first step. You'll take a real Gear program, upload and validate its WASM on Ethereum, create a program instance, and then interact with it from a normal dApp flow. We'll send messages, read state, and verify that everything works end-to-end from the user side — including a simple MetaMask interaction so you can feel the loop as a real Ethereum developer would.

By the end, you'll have a running Vara.eth program anchored to Ethereum, a clear mental model of how execution and finalization work, and a template you can reuse to ship your own high-performance apps without leaving L1.

### Resources

| Resource | Description |
| --- | --- |
| [📄 One-Pager](https://gear-tech.io/gear-exe/whitepaper/vara.eth-one-pager.pdf) | Quick overview of the Vara.eth approach |
| [📚 Whitepaper](https://eth.vara.network/whitepaper/) | High-level explanation and vision |
| [📖 Technical Documentation](https://eth.vara.network/whitepaper/technical-docs) | Detailed architecture, design, and implementation |
| [💻 Example dApp](https://github.com/gear-foundation/one-of-us) | One of Us — complete working example |
| [🔧 Sails Documentation](https://wiki.vara.network/docs/build/sails) | Sails framework documentation |

## Building the Program

Our running example is **One of Us** — a small "fancy counter" that records Ethereum addresses of everyone who joins, prevents duplicates, and lets anyone query how many builders are in. It touches all the core patterns: persistent state, exported service methods, message-driven updates, and clean interface boundaries.

The program is written in Rust using the **Sails framework**. A useful thing to note: this program is **identical for Vara and Vara.eth**. You don't write a separate "Ethereum version."

🔗 [gear-foundation/one-of-us](https://github.com/gear-foundation/one-of-us)

### Prerequisites

Make sure your environment matches the standard Gear/Vara prerequisites: recent Rust toolchain, WASM build target, and basic system packages.

See: [Getting started in 5 minutes](https://wiki.vara.network/docs/getting-started-in-5-minutes)

### Build

```bash
cargo build --release
```

After the build completes, your optimized WASM artifact will be in:

```
target/wasm32-gear/release/*.opt.wasm
```

> ✅ **Done!** You now have a Gear/Sails program compiled for Vara.eth. Next, we'll upload it to Ethereum for validation.

### Generate Solidity Interface (Optional)

If you want to interact with your Vara.eth program using Ethereum's native ABI encoding — for example, calling it from other Solidity contracts or using standard Ethereum tooling — you can generate a Solidity interface from your program's IDL.

```bash
cargo sails sol --idl-path ./target/wasm32-gear/release/one_of_us.idl
```

This generates an `OneOfUs.sol` file containing:

- **IOneOfUs** — interface with all your program's methods
- **OneOfUsAbi** — ABI contract for deployment
- **IOneOfUsCallbacks** — callback interface for receiving replies
- **OneOfUsCaller** — example contract showing how to call your program

> 💡 **When do you need this?**
>
> You only need the Solidity interface if you want to call your Vara.eth program from other smart contracts or prefer using Ethereum ABI tooling. For direct interaction via TypeScript/JavaScript, you can use the sails-js library with IDL instead.

## Uploading Program Code

Now that you have an optimized WASM build, the next step is to get it onto Ethereum. First, it needs to be uploaded and validated through the vara-eth CLI. Think of this as the Ethereum-side "registration" of your WASM code.

### Getting the CLI

**Option 1: Download from get.gear.rs**

Get corresponding build from [get.gear.rs](https://get.gear.rs/)

**Option 2: Build from source**

```bash
# Clone the gear repo, then build the CLI
git clone https://github.com/gear-tech/gear.git
cargo build -p ethexe-cli -r
```

### Insert Your Key

```bash
./target/release/ethexe key insert $SENDER_PRIVATE_KEY
```

### Upload the WASM

```bash
./target/release/ethexe --cfg none tx \
  --ethereum-rpc "wss://hoodi-reth-rpc.gear-tech.io/ws" \
  --ethereum-router "0x579D6098197517140e5aec47c78d6f7181916dd6" \
  --sender "$SENDER_ADDRESS" \
  upload target/wasm32-gear/release/one_of_us.opt.wasm -w
```

> ⚠️ **Get Test ETH**
>
> Don't forget to get some test ETH on Hoodi to cover gas before you upload — use [hoodifaucet.io](https://www.hoodifaucet.io/)

### Result example

```
Transaction: 0xe5d6515879c6b1b3c0fe52981968e736595b5dedb0cecd2760966ed9c9030636
Code ID: 0x59810e0b451a041adff0fe2e551430186c664e2a97c80a80154003b74dd8829d
```

## Program Creation
Install the dependencies to be able to run the scripts:
```bash
npm install
```

Uploading gives you a validated `codeId`, but there's still no running program yet. Program creation is the moment your WASM turns into an actual instance anchored on L1.

To create the program, run:
```bash
npm run create
```

Once you create it, Ethereum deploys a dedicated **Mirror contract** for your program. That Mirror becomes your on-chain gateway: the mailbox where you send messages, read the latest state hash, top up execution balance, and generally interact with the program.

🔗 [View full script: create-program.ts](https://github.com/gear-foundation/one-of-us/blob/master/deploy/create-program.ts)

```typescript
import { createPublicClient, createWalletClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { EthereumClient } from '@vara-eth/api';

const hoodi = defineChain({
  id: 560048,
  name: 'Hoodi Testnet',
  network: 'hoodi',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: { default: { http: [ETH_RPC] } },
  testnet: true,
});

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);

  const publicClient = createPublicClient({ chain: hoodi, transport: http(ETH_RPC) });
  const walletClient = createWalletClient({ account, chain: hoodi, transport: http(ETH_RPC) });

  // Setup Vara.eth client
  const ethereumClient = new EthereumClient(publicClient, walletClient, ROUTER_ADDRESS);
  await ethereumClient.isInitialized;
  const router = ethereumClient.router;

  // Create program instance
  const tx = await router.createProgram(CODE_ID);
  const receipt = await tx.sendAndWaitForReceipt();

  // Get the program ID (Mirror address)
  const programId = await tx.getProgramId();
  console.log('Program ID:', programId);
}
```

### Option 2: Create Program with Solidity ABI Interface (Foundry)

If you want to interact with your Vara.eth program using a familiar Solidity ABI (for example, from other smart contracts or Ethereum tooling), you can create the program with an ABI interface. We use **Foundry** for deploying and verifying the ABI contract — it handles compilation, deployment, and Etherscan verification in one step.

#### Install Foundry

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies (from project root)
forge install
```

#### Generate Solidity Interface

```bash
cargo sails sol --idl-path ./target/wasm32-gear/release/one_of_us.idl
```

#### Foundry Deploy Script

Create a deploy script at `deploy/DeployOneOfUsAbi.s.sol`:

🔗 [View full script: DeployOneOfUsAbi.s.sol](https://github.com/gear-foundation/one-of-us/blob/master/deploy/DeployOneOfUsAbi.s.sol)

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {OneOfUsAbi} from "../OneOfUs.sol";

contract DeployOneOfUsAbi is Script {
    function run() external returns (address) {
        bytes32 pkBytes = vm.envBytes32("PRIVATE_KEY");
        uint256 deployerPrivateKey = uint256(pkBytes);

        vm.startBroadcast(deployerPrivateKey);

        OneOfUsAbi abiContract = new OneOfUsAbi();
        console.log("OneOfUsAbi deployed at:", address(abiContract));

        vm.stopBroadcast();
        return address(abiContract);
    }
}
```

#### Deploy and Create Program

The TypeScript script handles both deployment via Foundry and program creation.

Run the script to create the program with the ABI.
```bash
npm run create:abi
```
🔗 [View full script: create-program-abi.ts](https://github.com/gear-foundation/one-of-us/blob/master/deploy/create-program-abi.ts)

```typescript
import { execSync } from 'child_process';
import { EthereumClient } from '@vara-eth/api';

function deployWithForge(): string {
  const etherscanKey = process.env.ETHERSCAN_API_KEY;
  const verifyFlag = etherscanKey ? `--verify --etherscan-api-key ${etherscanKey}` : '';

  const output = execSync(
    `forge script deploy/DeployOneOfUsAbi.s.sol:DeployOneOfUsAbi \
      --rpc-url ${ETH_RPC} \
      --broadcast ${verifyFlag} -vvv`,
    { cwd: projectRoot, encoding: 'utf-8' }
  );

  // Parse deployed address from output
  const match = output.match(/deployed at:\s*(0x[a-fA-F0-9]{40})/i);
  return match[1];
}

async function main() {
  // Step 1: Deploy ABI contract with Foundry
  const abiAddress = deployWithForge();
  console.log('ABI Contract deployed:', abiAddress);

  // Step 2: Create program with ABI interface
  const ethereumClient = new EthereumClient(publicClient, walletClient, ROUTER_ADDRESS);
  await ethereumClient.isInitialized;

  const tx = await ethereumClient.router.createProgramWithAbiInterface(CODE_ID, abiAddress);
  const receipt = await tx.sendAndWaitForReceipt();
  const programId = await tx.getProgramId();

  console.log('Program ID:', programId);
}
```

#### Link Mirror as Proxy on Etherscan

After deployment, you need to link the Mirror contract (your `PROGRAM_ID`) to the ABI contract on Etherscan. This enables the familiar Read/Write Contract interface on your Mirror.


> 🔗 **How to link**
>
> 1. Go to your `PROGRAM_ID` (Mirror address) on [Hoodi Etherscan](https://hoodi.etherscan.io)
> 2. Click the **"Code"** tab
> 3. Click **"More Options"** → **"Is this a proxy?"**
> 4. Click **"Verify"** — Etherscan will auto-detect the ABI contract
> 5. Confirm the linking
>
> Once linked, the Mirror page will show all ABI methods in Read/Write Contract tabs, making interaction much easier through Etherscan UI.

## Top-Up Program Balance

Before your program can execute anything, it needs fuel. Vara.eth doesn't charge users for computation directly — instead, every program has an internal **Executable Balance** funded in wVARA. When messages arrive, executors spend from that balance to run your WASM. If the balance is low, the system won't "break"; messages simply wait in the queue until the program is topped up again. That's the core of the **reverse-gas model**: developers fund execution, users just sign and use the app.

Practically, topping up is a two-step Ethereum flow. First you approve your program (or its Mirror) to spend wVARA from your wallet, then you call the Mirror's top-up method to move wVARA into the program's executable balance. The Mirror records the top-up on Ethereum and signals executors that the program is funded.

🔗 [Get your wVARA](https://idea.gear-tech.io/balance)

Run the script to top up the program balance:

```bash
npm run fund
```

🔗 [View full script: fund-program.ts](https://github.com/gear-foundation/one-of-us/blob/master/deploy/fund-program.ts)


```typescript
import { EthereumClient, getMirrorClient } from '@vara-eth/api';

async function main() {
  const ethereumClient = new EthereumClient(publicClient, walletClient, ROUTER_ADDRESS);
  await ethereumClient.isInitialized;
  const wvara = ethereumClient.wvara;
  const mirror = getMirrorClient(PROGRAM_ID, walletClient, publicClient);

  const amount = BigInt(10_000_000_000_000); // 10 wVARA

  // Step 1: Approve wVARA for the program to spend
  const approveTx = await wvara.approve(PROGRAM_ID, amount);
  await approveTx.sendAndWaitForReceipt();

  // Step 2: Top up executable balance via Mirror
  const topUpTx = await mirror.executableBalanceTopUp(amount);
  await topUpTx.sendAndWaitForReceipt();
}
```

## Program Interaction

Once your program is created and funded, you can start talking to it. In Vara.eth there are **two interaction paths**:

| Path | Description |
| --- | --- |
| **L1 Classic Transaction** | Send messages as normal Ethereum transactions to the program's Mirror contract, then wait for execution and final settlement on L1. |
| **FAST Pre-confirmed (Injected)** | Off-chain pre-confirmation with eventual Ethereum settlement. Web2-like speed, L1 finality. |

### Classic Transaction (via Mirror)

This is the normal Ethereum flow. You still use Sails ABI/IDL so you never touch raw bytes by hand.

> 💡 **Quick Testing via Etherscan**
>
> If your program's Mirror contract is verified with ABI (see "Link Mirror as Proxy" above), you can interact with it directly through Etherscan. Go to the Mirror address on Hoodi Etherscan, open the **Write Contract** tab, connect your wallet, and call `sendMessage` with your encoded payload. Great for quick tests without writing code.

Run the script to init the program:

```bash
npm run init
```
and then to send the message to the program
```bash
npm run classic
```
🔗 [View full script: classic-tx.ts](https://github.com/gear-foundation/one-of-us/blob/master/deploy/classic-tx.ts)

```typescript
import { EthereumClient, getMirrorClient } from '@vara-eth/api';
import { Sails } from 'sails-js';
import { SailsIdlParser } from 'sails-js-parser';

async function main() {
  const ethereumClient = new EthereumClient(publicClient, walletClient, ROUTER_ADDRESS);
  await ethereumClient.isInitialized;
  const mirror = getMirrorClient(PROGRAM_ID, walletClient, publicClient);

  // Initialize Sails from your program IDL
  const parser = await SailsIdlParser.new();
  const sails = new Sails(parser);
  sails.parseIdl(readFileSync('./one_of_us.idl', 'utf-8'));

  // Encode a regular call using ABI/IDL
  const payload = sails.services.OneOfUs.functions.JoinUs.encodePayload();

  // Send through Ethereum to Mirror
  const tx = await mirror.sendMessage(payload, 0n);
  const receipt = await tx.sendAndWaitForReceipt();

  // Wait for the program reply
  const { waitForReply } = await tx.setupReplyListener();
  const { payload: replyPayload } = await waitForReply;

  // Decode result
  const result = sails.services.OneOfUs.functions.JoinUs.decodeResult(replyPayload);
}
```

### Pre-confirmed Transaction (Injected)

This is what makes Vara.eth feel different in practice: **off-chain pre-confirmation with eventual Ethereum settlement**.

Instead of waiting for an L1 transaction to be mined, you submit your message directly to the executor network. Executors run the WASM program immediately, return a cryptographically backed pre-confirmation in near real time, and then the same result is later anchored on Ethereum.

> ✅ **Zero Gas for Users**
>
> Your users don't even have to pay for this interaction. Execution is funded from the program's internal wVARA balance — not from the user's pocket. The user just signs in MetaMask, gets an instant pre-confirmation, and moves on.

Run the script to send the injected transaction:
```bash
npm run injected
```

🔗 [View full script: test-injected.ts](https://github.com/gear-foundation/one-of-us/blob/master/deploy/test-injected.ts)

🔗 [Full @vara-eth/api documentation](https://github.com/gear-tech/gear-js/tree/main/apis/vara-eth)

```typescript
import { EthereumClient, VaraEthApi, WsVaraEthProvider } from '@vara-eth/api';

async function main() {
  const ethereumClient = new EthereumClient(publicClient, walletClient, ROUTER_ADDRESS);
  await ethereumClient.isInitialized;

  // Connect to Vara.eth network via WebSocket
  const api = new VaraEthApi(new WsVaraEthProvider(VARA_ETH_WS), ethereumClient);

  // Encode the call
  const payload = sails.services.OneOfUs.functions.JoinUs.encodePayload();

  // Build an injected tx (off-chain pre-confirmation path)
  const injected = await api.createInjectedTransaction({
    destination: PROGRAM_ID,
    payload: payload,
    value: 0n,
  });

  // Wait for full transaction promise (includes reply)
  const result = await injected.sendAndWaitForPromise();
  // Result contains 'Accept' or 'Reject' status with reply payload
}
```

## Read State

Once you've sent your first messages, the next thing you'll want is a reliable way to check what the program looks like "right now."

The canonical program state is anchored on Ethereum as a **state hash** in the Mirror contract, while the full state lives on the Vara.eth side and can be fetched by that hash.

> ⏱ **When Can You Read the New State?**
>
> **Classic L1 transaction:** You can only read the updated state after the transaction is finalized on Ethereum. Until then, you're still seeing the previous state.
>
> **Injected transaction:** There are two moments to consider. Calling `send()` returns `Accept` or `Reject` immediately — this is a guarantee that the validator has accepted the transaction and will execute it, but the state hasn't changed yet. If you use `sendAndWaitForPromise()`, you wait for the actual execution result (reply). Once you receive that reply, the state is updated and you can read it immediately.
>
> **Optimistic UI:** If your app knows the computational result in advance (e.g., incrementing a counter), you can update the UI right after receiving `Accept` — you have a guarantee the transaction will be included.

Run the script to read state:
```bash
npm run state
```

🔗 [View full script: read-state.ts](https://github.com/gear-foundation/one-of-us/blob/master/deploy/read-state.ts)

```typescript
import { EthereumClient, VaraEthApi, WsVaraEthProvider, getMirrorClient } from '@vara-eth/api';

async function main() {
  const ethereumClient = new EthereumClient(publicClient, walletClient, ROUTER_ADDRESS);
  await ethereumClient.isInitialized;
  const mirror = getMirrorClient(PROGRAM_ID, walletClient, publicClient);

  // Connect to Vara.eth API
  const api = new VaraEthApi(new WsVaraEthProvider(VARA_ETH_WS), ethereumClient);

  // Get the current state hash from Ethereum (Mirror contract)
  const stateHash = await mirror.stateHash();

  // Query: How many builders joined?
  const countPayload = sails.services.OneOfUs.queries.Count.encodePayload();

  const countReply = await api.call.program.calculateReplyForHandle(account.address, PROGRAM_ID, countPayload);

  const count = sails.services.OneOfUs.queries.Count.decodeResult(countReply.payload);
  console.log('Builders count:', count);

  // Query: Who are the builders? (paginated)
  const buildersPayload = sails.services.OneOfUs.queries.List.encodePayload(0, 100); // page 0, 100 items

  const buildersReply = await api.call.program.calculateReplyForHandle(account.address, PROGRAM_ID, buildersPayload);

  const builders = sails.services.OneOfUs.queries.List.decodeResult(buildersReply.payload);
  console.log('Builders list:', builders);
}
```

#### Understanding State Types

**Business Logic State via Execution:** When you need to execute program logic and get computed results, use `calculateReplyForHandle`. This actually runs your query through the WASM program.

**Program Metadata and Storage State:** For system-level information and raw program state, use `readState`. This returns infrastructure-level data about the program's storage, balance, and system state.

## Complete Flow

| Step   | Action                                | Command / Result                                             |
| ------ | ------------------------------------- | ------------------------------------------------------------ |
| **1**  | Build your Rust program with Sails    | `cargo build --release`                                      |
| **2**  | Upload WASM via CLI                   | `ethexe upload program.opt.wasm` → Get `CODE_ID`             |
| **3a** | Create program (Standard)             | `router.createProgram(CODE_ID)` → Get `PROGRAM_ID`           |
| **3b** | Create program (With ABI via Foundry) | `npm run create:abi` → Get `PROGRAM_ID` + `ABI_ADDRESS`      |
| **3c** | Link on Etherscan                     | Code → More Options → "Is this a proxy?" → Verify            |
| **4**  | Fund the program                      | `wvara.approve()` + `mirror.executableBalanceTopUp()`        |
| **5a** | Interact (Classic)                    | `mirror.sendMessage()` — Full L1 finality                    |
| **5b** | Interact (Injected)                   | `api.createInjectedTransaction()` — Instant pre-confirmation |
| **6**  | Read state                            | `api.call.program.calculateReplyForHandle()`                 |

### Summary

- ✅ Build a Gear program with Sails
- ✅ Upload and validate WASM on Ethereum
- ✅ Create a program instance (Mirror contract) — standard or with Solidity ABI via Foundry
- ✅ Link Mirror as proxy on Etherscan (for ABI option)
- ✅ Fund the program with wVARA (reverse-gas model)
- ✅ Send messages via classic Ethereum transactions
- ✅ Send injected transactions for instant pre-confirmations
- ✅ Read program state from Vara.eth

The key takeaway: Vara.eth gives you **Ethereum's security and liquidity** with **parallel WASM execution and Web2-like speed**. Your users interact through MetaMask like any other Ethereum app, but under the hood, they're getting instant feedback from a high-performance compute layer.

---

<div align="center">

### Welcome to Vara.eth.

# **Be one of us.**

</div>
