import type { Hex } from "viem";
import type { LocalWalletBinding, PluginConfig, TransferPlan } from "./types.js";
export declare function sendFinalTransfer(plan: TransferPlan, _config: PluginConfig, localWallet?: LocalWalletBinding): Promise<Hex>;
