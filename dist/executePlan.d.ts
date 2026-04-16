import type { ExecutionResult, LocalWalletBinding, TransferPlan } from "./types.js";
export declare function executeTransferPlan(plan: TransferPlan, localWallet?: LocalWalletBinding): Promise<ExecutionResult>;
