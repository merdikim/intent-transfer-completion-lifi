# intent_transfer_completion_lifi

Use this skill when a user expresses a token transfer intent in natural language and the plugin should decide whether it can complete the transfer directly from the destination chain balance or must source the shortfall through LI.FI first.

## Goal

Turn a request like:

- `send 50usdc to merkim.eth on base`
- `send 0.1 eth to vitalik.eth on arbitrum`
- `transfer 250 dai to 0xabc... on optimism`

into a call to the native plugin tool `complete_transfer_intent`.

The tool parses the intent, resolves the recipient and destination asset, checks the local wallet balance on the destination chain, optionally plans a LI.FI route to cover any shortfall, then executes the final transfer.

## When to invoke the tool

Invoke `complete_transfer_intent` whenever the user is clearly asking to send or transfer a token amount to a recipient on a destination chain.

Signals include:

- a verb like `send` or `transfer`
- a token amount
- a recipient address or ENS name
- a destination chain

The current parser expects intents in this shape:

- `send 50usdc to merkim.eth on base`
- `transfer 250 dai to 0xabc... on optimism`

If one of amount, token, recipient, or chain is missing, ask only for the missing field.

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
  "walletPath": "./wallet.txt"
}
```

Notes:

- `walletPath` is optional. If omitted, the tool uses `./wallet.txt`.
- The current implementation reads a local private key from that file to resolve the sending wallet.
- Preserve the user’s original transfer phrasing in `intent` whenever possible instead of rewriting it.

## Assistant behavior

- Prefer calling the tool instead of manually reasoning through balances, bridges, swaps, or status.
- Do not reimplement routing logic in the model.
- If the request is missing exactly one critical field, ask for that field succinctly.
- If the request already includes amount, token, recipient, and chain, call the tool immediately.
- Treat `.eth` recipients as valid inputs for the tool.
- Treat direct hex addresses as valid inputs for the tool.
- Do not ask the user for a source wallet address just to invoke the tool.
- Only include `walletPath` when the user specifies a non-default wallet file or when the calling context already requires it.
- Do not promise support for arbitrary recipient naming systems; the current implementation explicitly supports hex addresses and `.eth` names.

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

User: `send 50 usdc to merkim.eth`

Action:

Ask for the missing destination chain succinctly.

User: `send 50usdc to merkim.eth on base using ./alt-wallet.txt`

Action:

```json
{
  "intent": "send 50usdc to merkim.eth on base",
  "walletPath": "./alt-wallet.txt"
}
```
