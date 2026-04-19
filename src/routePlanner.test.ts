import test from "node:test";
import assert from "node:assert/strict";
import { zeroAddress } from "viem";

import { planTransfer } from "./routePlanner.js";
import { InsufficientFundsError } from "./errors.js";
import type { AssetRef, BalancePosition, ResolvedIntent } from "./types.js";

const ownerAddress = "0x1111111111111111111111111111111111111111";
const recipientAddress = "0x2222222222222222222222222222222222222222";

const targetAsset: AssetRef = {
  symbol: "USDC",
  address: zeroAddress,
  decimals: 6,
  chainId: 8453,
  chainKey: "bas"
};

const resolvedIntent: ResolvedIntent = {
  parsed: {
    rawIntent: "send 10 usdc to 0x2222222222222222222222222222222222222222 on base",
    action: "send",
    amount: "10",
    tokenSymbol: "USDC",
    recipient: recipientAddress,
    requestedChain: "base"
  },
  recipient: {
    raw: recipientAddress,
    resolvedAddress: recipientAddress
  },
  chain: {
    id: 8453,
    key: "bas",
    name: "Base"
  },
  asset: targetAsset,
  amountRaw: 10_000_000n
};

test("planTransfer throws when there are no spendable balances", async () => {
  await assert.rejects(
    () => planTransfer(resolvedIntent, ownerAddress, [], 0n),
    (error: unknown) => {
      assert.ok(error instanceof InsufficientFundsError);
      assert.equal(
        error.message,
        "No spendable balances were found across configured chains."
      );
      return true;
    }
  );
});

test("planTransfer throws when only the target asset exists but is still insufficient", async () => {
  const balances: BalancePosition[] = [
    {
      chainId: 8453,
      chainKey: "bas",
      token: targetAsset,
      rawAmount: 3_000_000n,
      formattedAmount: "3"
    }
  ];

  await assert.rejects(
    () => planTransfer(resolvedIntent, ownerAddress, balances, 3_000_000n),
    (error: unknown) => {
      assert.ok(error instanceof InsufficientFundsError);
      assert.equal(
        error.message,
        "Not enough funds available. Only USDC was found, but the available balance does not cover the requested amount."
      );
      return true;
    }
  );
});
