# intent-transfer-completion-lifi

Production-ready OpenClaw extension composed of:

- a native plugin/tool named `complete_transfer_intent`
- a bundled skill named `intent_transfer_completion_lifi`

The plugin fulfills natural-language token transfer intents such as:

- `send 50usdc to merkim.eth on base`
- `send 0.1 eth to vitalik.eth on arbitrum`
- `transfer 250 dai to 0xabc... on optimism`

When the wallet lacks enough of the requested token on the requested chain, the plugin:

1. parses the intent
2. resolves the destination chain, token, and recipient
3. inspects balances across configured chains
4. asks LI.FI for quotes/routes to cover the shortfall
5. enforces gas reserve and slippage policy
6. executes the route
7. performs the final native/ERC-20 transfer
8. tracks status until completion

## Files

- `openclaw.plugin.json`: plugin manifest with bundled skill and config schema
- `src/index.ts`: plugin entrypoint and tool implementation
- `skills/intent_transfer_completion_lifi/SKILL.md`: model instructions for when to invoke the tool

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure the plugin through OpenClaw plugin config or the native tool context. Provide:

- per-chain RPC URLs
- optional `lifiApiKey`
- optional `ensRpcUrl` for ENS recipients

3. Connect a local wallet in OpenClaw for live execution. The plugin discovers that wallet from native tool context and returns an error if none is available.

4. Build:

```bash
npm run build
```

5. Test:

```bash
npm test
```

## Notes

- All executable logic lives in the TypeScript plugin.
- The bundled skill contains routing guidance only.
- Live execution requires a funded local OpenClaw wallet.
- ENS resolution uses the configured `ensRpcUrl`.
- The runtime does not load configuration from `.env`.
