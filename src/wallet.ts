import { MissingSignerError } from "./errors.js";
import { createWalletClient, http } from "viem";
import type { Address } from "viem";
import type { LocalWalletBinding } from "./types.js";
import {readFileSync} from "fs";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export async function resolveLocalWallet(walletPath: string): Promise<LocalWalletBinding> {
  try {
    const privateKey = readFileSync(walletPath, "utf-8");
    const account = privateKeyToAccount(`0x${privateKey.trim()}`);  
    const walletClient = createWalletClient({
      account,
      chain: mainnet,
      transport: http()
    })

    if (!walletClient) {
      throw new MissingSignerError();
    }

    return {
      address: account.address as Address,
      walletClient
    };
  } catch (error) {
    console.error("Error resolving local wallet:", error);
    throw new Error("Failed to resolve local wallet");
  }
}
