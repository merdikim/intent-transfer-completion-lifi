import { getAssetBalance } from "./balances.js";
import { ExecutionError } from "./errors.js";
import type { Address } from "viem";
import type { AssetRef } from "./types.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForBalanceIncrease(params: {
  ownerAddress: Address;
  asset: AssetRef;
  minimumBalance: bigint;
}): Promise<void> {
  const deadline = Date.now() + 15 * 60 * 1000; // 15 minute timeout

  while (Date.now() < deadline) {
    const balance = await getAssetBalance(params.ownerAddress, params.asset);
    if (balance >= params.minimumBalance) {
      return;
    }

    await sleep(5000); // Poll every 5 seconds
  }

  throw new ExecutionError(
    `Timed out while waiting for ${params.asset.symbol} balance on ${params.asset.chainKey} to reach the expected amount.`
  );
}
