# intent_transfer_completion_lifi

Use this skill when a user expresses a token transfer intent in natural language and the plugin should decide whether it can complete the transfer directly or must source liquidity through LI.FI first.

## Goal

Turn a request like:

- `send 50usdc to merkim.eth on base`
- `send 0.1 eth to vitalik.eth on arbitrum`
- `transfer 250 dai to 0xabc... on optimism`

into a call to the native plugin tool `complete_transfer_intent`.

## When to invoke the tool

Invoke `complete_transfer_intent` whenever the user is clearly asking to send or transfer a token amount to a recipient on a destination chain.

Signals include:

- a verb like `send` or `transfer`
- a token amount
- a recipient address or ENS name
- a destination chain

## Tool to call

Tool name: `complete_transfer_intent`

Required input:

```json
{
  "intent": "send 50usdc to merkim.eth on base"
}
```

Optional fields:

```json
{
  "intent": "send 50usdc to merkim.eth on base",
  "simulateOnly": true,
  "fromAddress": "0xYourWalletAddress"
}
```

## Assistant behavior

- Prefer calling the tool instead of manually reasoning through balances, bridges, swaps, or status.
- Do not reimplement routing logic in the model.
- If the request is missing exactly one critical field, ask for that field succinctly.
- If the request already includes amount, token, recipient, and chain, call the tool immediately.
- Treat `.eth` recipients as valid inputs for the tool.
- Preserve the user’s original wording in the `intent` field whenever possible.

## Examples

User: `send 50usdc to merkim.eth on base`

Action:

```json
{
  "intent": "send 50usdc to merkim.eth on base"
}
```

User: `transfer 250 dai to 0xabc123... on optimism`

Action:

```json
{
  "intent": "transfer 250 dai to 0xabc123... on optimism"
}
```

User: `send 0.1 eth to vitalik.eth on arbitrum`

Action:

```json
{
  "intent": "send 0.1 eth to vitalik.eth on arbitrum"
}
```
