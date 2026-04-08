import type { Address } from "viem";
import type { AssetRef, PluginConfig } from "./types.js";
export declare function waitForBalanceIncrease(params: {
    ownerAddress: Address;
    asset: AssetRef;
    minimumBalance: bigint;
    config: PluginConfig;
}): Promise<void>;
