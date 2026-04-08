import { IntentParseError } from "./errors.js";
import type { ParsedIntent } from "./types.js";

const INTENT_PATTERN =
  /^(send|transfer)\s+([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z0-9]+)\s+to\s+([^\s]+)\s+on\s+([a-zA-Z0-9 ]+)$/i;

export function parseIntent(intent: string): ParsedIntent {
  const normalized = intent.trim().replace(/\s+/g, " ");
  const match = normalized.match(INTENT_PATTERN);
  if (!match) {
    throw new IntentParseError(
      "Intent must look like 'send 50usdc to merkim.eth on base' or 'transfer 250 dai to 0xabc... on optimism'."
    );
  }

  const [, action, amount, tokenSymbol, recipient, requestedChain] = match;
  return {
    rawIntent: intent,
    action: action.toLowerCase() as ParsedIntent["action"],
    amount,
    tokenSymbol: tokenSymbol.toUpperCase(),
    recipient,
    requestedChain: requestedChain.trim()
  };
}
