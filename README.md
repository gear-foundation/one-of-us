# One of Us — Deployment Scripts

## Build

From project root:

```bash
cargo build --release
```

Output: `target/wasm32-gear/release/one_of_us.opt.wasm`

## Generate Solidity Interface (Optional)

If you need to interact with your program from Solidity contracts or use Ethereum ABI tooling:

```bash
cargo sails sol --idl-path ./target/wasm32-gear/release/one_of_us.idl
```

Output: `OneOfUs.sol` — contains interface, ABI contract, and callback definitions.

## Setup

```bash
cd deploy
npm install
cp .env.example .env
```

### Foundry Setup (for ABI deployment)

If you plan to deploy with Solidity ABI interface, install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Then install dependencies from project root:

```bash
forge install
```

## .env Variables

Variables appear in order as you complete each step:

```bash
# Initial setup (required)
PRIVATE_KEY=0x...           # Your Ethereum private key
ETH_RPC=https://...         # Ethereum HTTP RPC (Hoodi)
ETH_RPC_WS=wss://...        # Ethereum WebSocket RPC (for subscriptions)
ROUTER_ADDRESS=0x...        # Router contract
WVARA_ADDRESS=0x...         # wVARA token contract
VARA_ETH_WS=wss://...       # Vara.eth WebSocket (for injected tx)

# For Etherscan verification (optional but recommended)
ETHERSCAN_API_KEY=...       # Get from hoodi.etherscan.io

# After upload (step 1)
CODE_ID=0x...               # Validated code hash

# After create (step 2)
PROGRAM_ID=0x...            # Program Mirror address
ABI_ADDRESS=0x...           # ABI contract address (if using Option B)
```

## Complete Flow

> ⚠️ **Important:** Wait for Ethereum finalization after each step before proceeding to the next.

### 1. Upload Code

```bash
npm run upload
```

→ Get `CODE_ID`, add to `.env`

### 2. Create Program

**Option A: Standard creation**

```bash
npm run create
```

→ Get `PROGRAM_ID`, add to `.env`

**Option B: With Solidity ABI interface (using Foundry)**

This option deploys an ABI contract and links it to your program, enabling interaction via standard Ethereum ABI tooling.

```bash
# 1. Generate Solidity interface from IDL (if not done already)
cargo sails sol --idl-path ../target/wasm32-gear/release/one_of_us.idl

# 2. Deploy ABI contract and create program in one step
npm run create:abi
```

This script:

- Deploys `OneOfUsAbi` contract using Foundry (`forge script`)
- Automatically verifies on Etherscan (if `ETHERSCAN_API_KEY` is set)
- Creates program with ABI interface via Router

→ Get `PROGRAM_ID` and `ABI_ADDRESS`, add to `.env`

#### Link Mirror as Proxy on Etherscan

After deployment, link your Mirror contract to the ABI contract on Etherscan:

1. Go to your `PROGRAM_ID` (Mirror) address on [Hoodi Etherscan](https://hoodi.etherscan.io)
2. Click the **"Code"** tab
3. Click **"More Options"** → **"Is this a proxy?"**
4. Click **"Verify"** — Etherscan will detect the ABI contract
5. Confirm the linking

Once linked, the Mirror contract page will show all ABI methods (Read/Write Contract tabs), making interaction much easier.

### 3. Fund Program

```bash
npm run fund
```

→ Program receives wVARA balance

### 4. Initialize Program

```bash
npm run init
```

→ Program is ready to use

### 5. Interact

**Classic transaction (via Ethereum):**

```bash
npm run classic
```

**Injected transaction (instant pre-confirmation):**

```bash
npm run injected
```

**Read state:**

```bash
npm run state
```

## Scripts

| Script                  | Command              | Description                           |
| ----------------------- | -------------------- | ------------------------------------- |
| `upload-code.ts`        | `npm run upload`     | Upload WASM to Ethereum               |
| `create-program.ts`     | `npm run create`     | Create program instance (standard)    |
| `create-program-abi.ts` | `npm run create:abi` | Deploy ABI + create program (Foundry) |
| `fund-program.ts`       | `npm run fund`       | Top up wVARA balance                  |
| `init-program.ts`       | `npm run init`       | Initialize program                    |
| `classic-tx.ts`         | `npm run classic`    | Send classic L1 transaction           |
| `test-injected.ts`      | `npm run injected`   | Send injected transaction             |
| `read-state.ts`         | `npm run state`      | Query program state                   |

## Foundry Scripts

Located in project root, used by `create:abi`:

| Script                          | Description                       |
| ------------------------------- | --------------------------------- |
| `deploy/DeployOneOfUsAbi.s.sol` | Deploys and verifies ABI contract |

Run manually if needed:

```bash
forge script deploy/DeployOneOfUsAbi.s.sol:DeployOneOfUsAbi \
  --rpc-url $ETH_RPC \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvv
```
