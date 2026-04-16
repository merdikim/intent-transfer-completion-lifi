import type { Address } from "viem";
import type { AssetRef, BalancePosition, LifiClient, PluginConfig, ResolvedIntent, TransferPlan } from "./types.js";
type AssetBalanceGetter = (ownerAddress: Address, asset: AssetRef) => Promise<bigint>;
export declare function planTransfer(intent: ResolvedIntent, ownerAddress: Address, balances: BalancePosition[], assetBalanceOrLifiClient: bigint | LifiClient, config?: PluginConfig, assetBalanceGetter?: AssetBalanceGetter): Promise<TransferPlan>;
export {};
