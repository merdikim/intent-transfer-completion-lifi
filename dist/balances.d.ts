import type { Address } from "viem";
import type { AssetRef, BalancePosition, PluginConfig } from "./types.js";
export declare function getWalletBalances(ownerAddress: Address, config: PluginConfig): Promise<BalancePosition[]>;
export declare function getAssetBalance(ownerAddress: Address, asset: AssetRef, config: PluginConfig): Promise<bigint>;
