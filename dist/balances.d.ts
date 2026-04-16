import type { Address } from "viem";
import type { BalancePosition } from "./types.js";
export declare function getWalletBalances(ownerAddress: Address): Promise<BalancePosition[]>;
