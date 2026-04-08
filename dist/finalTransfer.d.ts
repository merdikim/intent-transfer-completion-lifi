import type { Hex } from "viem";
import type { PluginConfig, TransferPlan } from "./types.js";
export declare function sendFinalTransfer(plan: TransferPlan, config: PluginConfig): Promise<Hex>;
