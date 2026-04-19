# intent-transfer-completion-lifi

OpenClaw extension composed of:

- a native plugin/tool named `complete_transfer_intent`
- a bundled skill named `intent_transfer_completion_lifi`

The plugin fulfills natural-language token transfer intents such as:

- `send 50usdc to merkim.eth on base`
- `send 0.1 eth to vitalik.eth on arbitrum`
- `transfer 250 dai to 0xabc... on optimism`

The tool flow is:

1. parses the intent
2. resolves the destination chain, token, and recipient
3. loads the local sender wallet from a private key file
4. checks the sender balance on the destination chain
5. inspects balances across supported chains when the destination balance is insufficient
6. asks LI.FI for routes to cover the shortfall
7. executes the route when needed
8. performs the final native/ERC-20 transfer
9. waits for routed funds to arrive before the final send

## Files

- `openclaw.plugin.json`: plugin manifest with bundled skill and config schema
- `src/index.ts`: plugin entrypoint and tool implementation
- `skills/intent_transfer_completion_lifi/SKILL.md`: model instructions for when to invoke the tool

## Tool Contract

Tool name: `complete_transfer_intent`

Required input:

```json
{
  "intent": "send 50usdc to merkim.eth on base"
}
```

Optional input:

```json
{
  "intent": "send 50usdc to merkim.eth on base",
  "walletPath": "./wallet.txt"
}
```

Notes:

- If `walletPath` is omitted, the tool uses `./wallet.txt`.
- The wallet file should contain the sender private key.
- Recipients are currently supported as hex addresses or `.eth` names.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a wallet file for local execution:

```bash
printf '%s\n' '<private-key-without-0x-prefix>' > wallet.txt
```

3. Build:

```bash
npm run build
```

4. Test:

```bash
npm test
```

## Current Configuration

The current plugin config surface is minimal:

- `lifiBaseUrl`
- `integrator`

At the moment, the exported `configSchema` is effectively empty, and the runtime does not load `.env` files.

## Notes

- All executable logic lives in the TypeScript plugin.
- The bundled skill contains routing guidance only.
- Live execution requires a funded local wallet private key file.
- ENS resolution uses viem on Ethereum mainnet.
- Cross-chain balance discovery currently focuses on the stablecoins listed in `src/constants.ts`.
