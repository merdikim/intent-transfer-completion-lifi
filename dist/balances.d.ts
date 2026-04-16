import type { Address } from "viem";
import type { AssetRef, BalancesResult } from "./types.js";
export declare function getWalletBalances(ownerAddress: Address): Promise<BalancesResult>;
export declare function getAssetBalance(ownerAddress: Address, asset: AssetRef): Promise<bigint>;
