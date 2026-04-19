import type { Address } from "viem";
import type { AssetRef, BalancePosition } from "./types.js";
export declare function getWalletBalances(ownerAddress: Address): Promise<BalancePosition[]>;
export declare function getAssetBalance(ownerAddress: Address, asset: AssetRef): Promise<bigint>;
