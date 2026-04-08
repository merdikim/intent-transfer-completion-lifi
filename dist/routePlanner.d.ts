import type { Address } from "viem";
import { getAssetBalance } from "./balances.js";
import type { LifiClient } from "./lifiClient.js";
import type { BalancePosition, PluginConfig, ResolvedIntent, TransferPlan } from "./types.js";
export declare function planTransfer(intent: ResolvedIntent, ownerAddress: Address, balances: BalancePosition[], lifiClient: LifiClient, config: PluginConfig, balanceReader?: typeof getAssetBalance): Promise<TransferPlan>;
