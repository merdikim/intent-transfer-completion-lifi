import type { AssetRef, BalancePosition, GasPolicyResult, PluginConfig } from "./types.js";
export declare function evaluateGasPolicyForSpend(position: BalancePosition, config: PluginConfig): GasPolicyResult;
export declare function validateTargetGas(targetAsset: AssetRef, targetNativeBalanceRaw: bigint, config: PluginConfig): string[];
export declare function spendableAmount(position: BalancePosition, config: PluginConfig): bigint;
