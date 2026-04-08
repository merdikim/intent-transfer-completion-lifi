import {
  createWalletClient,
  encodeFunctionData,
  erc20Abi,
  http
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { MissingSignerError } from "./errors.js";
import { SUPPORTED_CHAINS } from "./config.js";
import type { Hex } from "viem";
import type { PluginConfig, TransferPlan } from "./types.js";

export async function sendFinalTransfer(plan: TransferPlan, config: PluginConfig): Promise<Hex> {
  if (!config.privateKey) {
    throw new MissingSignerError();
  }

  const rpcUrl = config.rpcUrls[plan.targetChain.key];
  if (!rpcUrl) {
    throw new Error(`Missing RPC URL for ${plan.targetChain.key}`);
  }

  const account = privateKeyToAccount(config.privateKey);
  const walletClient = createWalletClient({
    account,
    chain: SUPPORTED_CHAINS[plan.targetChain.key].chain,
    transport: http(rpcUrl)
  });

  if (plan.targetAsset.isNative) {
    return walletClient.sendTransaction({
      account,
      chain: SUPPORTED_CHAINS[plan.targetChain.key].chain,
      to: plan.recipient.resolvedAddress,
      value: plan.requestedAmountRaw
    });
  }

  return walletClient.sendTransaction({
    account,
    chain: SUPPORTED_CHAINS[plan.targetChain.key].chain,
    to: plan.targetAsset.address,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [plan.recipient.resolvedAddress, plan.requestedAmountRaw]
    })
  });
}
