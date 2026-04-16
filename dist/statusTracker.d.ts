import type { Address } from "viem";
import type { AssetRef } from "./types.js";
export declare function waitForBalanceIncrease(params: {
    ownerAddress: Address;
    asset: AssetRef;
    minimumBalance: bigint;
}): Promise<void>;
