import type { Hex } from "viem";
import type { LocalWalletBinding, TransferPlan } from "./types.js";
export declare function sendFinalTransfer(plan: TransferPlan, localWallet?: LocalWalletBinding): Promise<Hex>;
