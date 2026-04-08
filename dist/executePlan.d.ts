import type { ExecutionResult, LocalWalletBinding, PluginConfig, TransferPlan } from "./types.js";
export declare function executeTransferPlan(plan: TransferPlan, config: PluginConfig, localWallet?: LocalWalletBinding): Promise<ExecutionResult>;
