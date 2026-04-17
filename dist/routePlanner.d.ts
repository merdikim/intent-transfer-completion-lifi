import type { Address } from "viem";
import type { BalancePosition, ResolvedIntent, TransferPlan } from "./types.js";
export declare function planTransfer(intent: ResolvedIntent, ownerAddress: Address, balances: BalancePosition[], assetBalance: bigint): Promise<TransferPlan>;
