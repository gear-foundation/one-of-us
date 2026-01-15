# Be **One of Us**. Let's make Ethereum run real programs

> Deploy and run WASM programs on Ethereum through Vara.eth. No L2, no new chains — just Ethereum's security with parallel execution.

## Introduction

In this guide, we'll dive into the process of deploying and running actual WASM programs on Ethereum through Vara.eth. The idea is straightforward: take a WASM program and execute it in a high-performance parallel environment — while keeping Ethereum as the settlement and security layer. No Layer 2, no new chains, no liquidity fragmentation, and no extra trust assumptions. Just Ethereum's security model and liquidity, with a compute layer that finally lets your app breathe.

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

## The Program

Our running example is **One of Us** — a small "fancy counter" that records Ethereum addresses of everyone who joins, prevents duplicates, and lets anyone query how many builders are in. It touches all the core patterns: persistent state, exported service methods, message-driven updates, and clean interface boundaries.

The program is written in Rust using the **Sails framework**. A useful thing to note: this program is **identical for Vara and Vara.eth**. You don't write a separate "Ethereum version."

🔗 [gear-foundation/one-of-us](https://github.com/gear-foundation/one-of-us)

### Download Pre-built Files

Download the ready-to-use program files from the `sources/` folder:

| File | Description |
| --- | --- |
| [`one_of_us.opt.wasm`](https://github.com/gear-foundation/one-of-us/raw/master/sources/one_of_us.opt.wasm) | Optimized WASM program ready for upload |
| [`one_of_us.idl`](https://github.com/gear-foundation/one-of-us/raw/master/sources/one_of_us.idl) | IDL interface for sails-js interaction |
| [`OneOfUs.sol`](https://github.com/gear-foundation/one-of-us/raw/master/sources/OneOfUs.sol) | Solidity ABI interface (optional) |

> 💡 **Want to build from source?**
>
> If you prefer to build the program yourself, check out the [full source code](https://github.com/gear-foundation/one-of-us). Make sure your environment matches the standard Gear/Vara prerequisites — see [Getting started in 5 minutes](https://wiki.vara.network/docs/getting-started-in-5-minutes).
>
> ```bash
> cargo build --release
> ```
>
> Your optimized WASM will be in `target/wasm32-gear/release/one_of_us.opt.wasm`

## Uploading Program Code

Now that you have the WASM file, the next step is to get it onto Ethereum. It needs to be uploaded and validated through the vara-eth CLI. Think of this as the Ethereum-side "registration" of your WASM code.

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
  --ethereum-router "0xBC888a8B050B9B76a985d91c815d2c4f2131a58A" \
  --sender "$SENDER_ADDRESS" \
  upload sources/one_of_us.opt.wasm -w
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

Clone the repository and set up your environment:

```bash
git clone https://github.com/gear-foundation/one-of-us.git
cd one-of-us
```

Copy the environment template and configure it:

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```bash
# Pre-configured for Hoodi testnet
ROUTER_ADDRESS=0xBC888a8B050B9B76a985d91c815d2c4f2131a58A
WVARA_ADDRESS=0x2C960bd5347C2Eb4d9bBEA0CB9671C5b641Dcbb9

# RPC endpoints (Hoodi)
ETH_RPC=https://hoodi-reth-rpc.gear-tech.io
ETH_RPC_WS=wss://hoodi-reth-rpc.gear-tech.io/ws
VARA_ETH_WS=ws://vara-eth-validator-1.gear-tech.io:9944

# Your credentials
PRIVATE_KEY=0x...           # Your Ethereum private key

# Add after upload step
CODE_ID=0x...               # Your validated code hash from upload

# Add after create step
PROGRAM_ID=0x...            # Your program Mirror address
```

Install dependencies and navigate to the deploy folder:

```bash
npm install
cd deploy
```

> ⚠️ **Important:** All scripts below are run from the `deploy/` directory.

Uploading gives you a validated `codeId`, but there's still no running program yet. Program creation is the moment your WASM turns into an actual instance anchored on L1.

Add your `CODE_ID` from the upload step to `.env`, then create the program:

```bash
npm run create
```

After successful creation, add the returned `PROGRAM_ID` to your `.env` file.

Once you create it, Ethereum deploys a dedicated **Mirror contract** for your program. That Mirror becomes your on-chain gateway: the mailbox where you send messages, read the latest state hash, top up execution balance, and generally interact with the program.

🔗 [View script: create-program.ts](https://github.com/gear-foundation/one-of-us/blob/master/deploy/create-program.ts)

### Option 2: Create Program with Solidity ABI Interface (Foundry)

If you want to interact with your Vara.eth program using a familiar Solidity ABI (for example, from other smart contracts or Ethereum tooling), you can create the program with an ABI interface. We use **Foundry** for deploying and verifying the ABI contract — it handles compilation, deployment, and Etherscan verification in one step.

The pre-built `OneOfUs.sol` is already included in the [`sources/`](https://github.com/gear-foundation/one-of-us/tree/master/sources) folder.

#### Install Foundry

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Install Foundry dependencies (run from project root, not `deploy/`):

```bash
cd ..
forge install
cd deploy
```

#### Deploy and Create Program

Run the script to create the program with the ABI:

```bash
npm run create:abi
```

🔗 [View script: create-program-abi.ts](https://github.com/gear-foundation/one-of-us/blob/master/deploy/create-program-abi.ts) | [View Foundry script: DeployOneOfUsAbi.s.sol](https://github.com/gear-foundation/one-of-us/blob/master/deploy/DeployOneOfUsAbi.s.sol)

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

🔗 [View script: fund-program.ts](https://github.com/gear-foundation/one-of-us/blob/master/deploy/fund-program.ts)

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

First, initialize the program:

```bash
npm run init
```

Then send a message to the program:

```bash
npm run classic
```

🔗 [View script: classic-tx.ts](https://github.com/gear-foundation/one-of-us/blob/master/deploy/classic-tx.ts)

### Pre-confirmed Transaction (Injected)

This is what makes Vara.eth feel different in practice: **off-chain pre-confirmation with eventual Ethereum settlement**.

Instead of waiting for an L1 transaction to be mined, you submit your message directly to the executor network. Executors run the WASM program immediately, return a cryptographically backed pre-confirmation in near real time, and then the same result is later anchored on Ethereum.

> ✅ **Zero Gas for Users**
>
> Your users don't even have to pay for this interaction. Execution is funded from the program's internal wVARA balance — not from the user's pocket. The user just signs in MetaMask, gets an instant pre-confirmation, and moves on.

Run the script to send an injected transaction:

```bash
npm run injected
```

🔗 [View script: test-injected.ts](https://github.com/gear-foundation/one-of-us/blob/master/deploy/test-injected.ts) | [Full @vara-eth/api documentation](https://github.com/gear-tech/gear-js/tree/main/apis/vara-eth)

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

🔗 [View script: read-state.ts](https://github.com/gear-foundation/one-of-us/blob/master/deploy/read-state.ts)

#### Understanding State Types

**Business Logic State via Execution:** When you need to execute program logic and get computed results, use `calculateReplyForHandle`. This actually runs your query through the WASM program.

**Program Metadata and Storage State:** For system-level information and raw program state, use `readState`. This returns infrastructure-level data about the program's storage, balance, and system state.

## Complete Flow

| Step | Action | Command |
| --- | --- | --- |
| **1** | Get program files | Download from [`sources/`](https://github.com/gear-foundation/one-of-us/tree/master/sources) |
| **2** | Upload WASM via CLI | `ethexe upload one_of_us.opt.wasm` → Add `CODE_ID` to `.env` |
| **3** | Clone repo & setup | `git clone ...` → `cp .env.example .env` → `npm install` → `cd deploy` |
| **4a** | Create program (Standard) | `npm run create` → Add `PROGRAM_ID` to `.env` |
| **4b** | Create program (With ABI) | `npm run create:abi` → Add `PROGRAM_ID` to `.env` |
| **4c** | Link on Etherscan | Code → More Options → "Is this a proxy?" → Verify |
| **5** | Fund the program | `npm run fund` |
| **6a** | Interact (Classic) | `npm run init` then `npm run classic` |
| **6b** | Interact (Injected) | `npm run injected` |
| **7** | Read state | `npm run state` |

### Summary

- ✅ Download pre-built WASM and IDL files
- ✅ Upload and validate WASM on Ethereum
- ✅ Create a program instance (Mirror contract) — standard or with Solidity ABI via Foundry
- ✅ Link Mirror as proxy on Etherscan (for ABI option)
- ✅ Fund the program with wVARA (reverse-gas model)
- ✅ Send messages via classic Ethereum transactions
- ✅ Send injected transactions for instant pre-confirmations
- ✅ Read program state from Vara.eth

The key takeaway: Vara.eth gives you **Ethereum's security and liquidity** with **parallel WASM execution and Web2-like speed**. Your users interact through MetaMask like any other Ethereum app, but under the hood, they're getting instant feedback from a high-performance compute layer.

---

## Advanced: Running Locally (Development Mode)

For those who want to run Vara.eth locally for development and debugging:

### 1. Clone the Gear Repository

```bash
git clone https://github.com/gear-tech/gear.git
cd gear
```

### 2. Prerequisites

Complete the prerequisites from [Getting started in 5 minutes](https://wiki.vara.network/docs/getting-started-in-5-minutes#prerequisites).

### 3. Build Solidity Contracts

The build expects Solidity ABI artifacts. Install Foundry first:

```bash
# macOS
brew install foundry

# or follow Foundry install docs for Linux
```

Build the contracts:

```bash
cd ethexe/contracts
forge install
forge build
cd ../..
```

### 4. Build Vara.eth CLI

```bash
cargo build -p ethexe-cli --release
```

### 5. Run Local Node

```bash
./target/release/ethexe run --dev --block-time 6 --rpc-port 9944
```

### Available Endpoints

Once running, the following endpoints become available:

| Endpoint            | Address                                      | Description                              |
| ------------------- | -------------------------------------------- | ---------------------------------------- |
| **Ethexe RPC**      | `http://127.0.0.1:9944`                      | Main RPC endpoint for ethexe interaction |
| **Ethereum RPC**    | `ws://127.0.0.1:8545`                        | Ethereum-compatible RPC (Anvil)          |
| **Router Contract** | `0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9` | On-chain routing contract                |

> ⚠️ **Note:** In `--dev` mode, a local Ethereum environment is expected. If Anvil is not already running, start it separately with `anvil` on port 8545.

---

<div align="center">

### Welcome to Vara.eth.

# **Be one of us.**

</div>
