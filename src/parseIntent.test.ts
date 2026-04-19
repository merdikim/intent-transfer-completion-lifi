import test from "node:test";
import assert from "node:assert/strict";

import { parseIntent } from "./parseIntent.js";
import { IntentParseError } from "./errors.js";

test("parseIntent normalizes spacing and uppercases the token symbol", () => {
  const parsed = parseIntent("  transfer   12.5 usdc   to   merkim.eth   on  base  ");

  assert.deepEqual(parsed, {
    rawIntent: "  transfer   12.5 usdc   to   merkim.eth   on  base  ",
    action: "transfer",
    amount: "12.5",
    tokenSymbol: "USDC",
    recipient: "merkim.eth",
    requestedChain: "base"
  });
});

test("parseIntent accepts compact amount and token inputs", () => {
  const parsed = parseIntent("send 50usdc to 0x1234567890123456789012345678901234567890 on optimism");

  assert.equal(parsed.action, "send");
  assert.equal(parsed.amount, "50");
  assert.equal(parsed.tokenSymbol, "USDC");
  assert.equal(parsed.recipient, "0x1234567890123456789012345678901234567890");
  assert.equal(parsed.requestedChain, "optimism");
});

test("parseIntent rejects malformed intents", () => {
  assert.throws(
    () => parseIntent("please send usdc to base"),
    (error: unknown) => {
      assert.ok(error instanceof IntentParseError);
      assert.match(
        error.message,
        /Intent must look like/
      );
      return true;
    }
  );
});
