import { MissingSignerError } from "./errors.js";
import { createWalletClient, http } from "viem";
import type { Address, Chain } from "viem";
import type { LocalWalletBinding } from "./types.js";
import {readFileSync} from "fs";
import { privateKeyToAccount } from "viem/accounts";

export async function resolveLocalWallet(walletPath: string): Promise<LocalWalletBinding> {
  try {
    const privateKey = readFileSync(walletPath, "utf-8");
    const account = privateKeyToAccount(`0x${privateKey.trim()}`);

    return {
      account,
      address: account.address as Address,
      getWalletClient: (chain: Chain, rpcUrl?: string) =>
        createWalletClient({
          account,
          chain,
          transport: http(rpcUrl ?? chain.rpcUrls.default.http[0])
        })
    };
  } catch (error) {
    console.error("Error resolving local wallet:", error);
    throw new Error("Failed to resolve local wallet");
  }
}
