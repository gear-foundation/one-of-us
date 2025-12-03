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
# Generate Solidity interface from IDL
cargo sails sol --idl-path ./target/wasm32-gear/release/one_of_us.idl
```

Output: `OneOfUs.sol` — contains interface, ABI contract, and callback definitions.

## Setup

```bash
cd deploy
npm install
cp .env.example .env
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

# After upload (step 1)
CODE_ID=0x...               # Validated code hash

# After create (step 2)
PROGRAM_ID=0x...            # Program Mirror address
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

**Option B: With Solidity ABI interface**

```bash
# First, generate and compile Solidity interface
cargo sails sol --idl-path ./target/wasm32-gear/release/one_of_us.idl
cd deploy && npm run compile:sol

# Then create program with ABI
npm run create:abi
```

→ Get `PROGRAM_ID` and `ABI_ADDRESS`, add to `.env`

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

| Script                  | Command               | Description                       |
| ----------------------- | --------------------- | --------------------------------- |
| `upload-code.ts`        | `npm run upload`      | Upload WASM to Ethereum           |
| `create-program.ts`     | `npm run create`      | Create program instance           |
| `compile-sol.ts`        | `npm run compile:sol` | Compile Solidity → TypeScript ABI |
| `create-program-abi.ts` | `npm run create:abi`  | Create program with Solidity ABI  |
| `fund-program.ts`       | `npm run fund`        | Top up wVARA balance              |
| `init-program.ts`       | `npm run init`        | Initialize program                |
| `classic-tx.ts`         | `npm run classic`     | Send classic L1 transaction       |
| `test-injected.ts`      | `npm run injected`    | Send injected transaction         |
| `read-state.ts`         | `npm run state`       | Query program state               |
