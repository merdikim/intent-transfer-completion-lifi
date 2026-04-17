import {
  encodeFunctionData,
  erc20Abi,
  getAddress,
} from "viem";

import { LIFI_CHAIN_NAME_TO_VIEM_CHAIN, NATIVE_TOKEN_ADDRESS } from "./constants.js";
import { loadConfig } from "./config.js";
import { ExecutionError, MissingSignerError } from "./errors.js";
import type { Chain, Hex } from "viem";
import type { LocalWalletBinding, TransferPlan } from "./types.js";

export async function sendFinalTransfer(
  plan: TransferPlan,
  localWallet?: LocalWalletBinding
): Promise<Hex> {
  if (!localWallet) {
    throw new MissingSignerError();
  }

  const targetChain = resolveTargetChain(plan);
  const config = loadConfig();
  const rpcUrl = config.rpcUrls[plan.targetChain.key];
  const walletClient = localWallet.getWalletClient(targetChain, rpcUrl);
  const isNativeAsset = getAddress(plan.targetAsset.address) === NATIVE_TOKEN_ADDRESS;

  if (isNativeAsset) {
    return walletClient.sendTransaction({
      account: localWallet.account,
      chain: targetChain,
      kzg: undefined,
      to: plan.recipient.resolvedAddress,
      value: plan.requestedAmountRaw
    });
  }

  return walletClient.sendTransaction({
    account: localWallet.account,
    chain: targetChain,
    kzg: undefined,
    to: plan.targetAsset.address,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [plan.recipient.resolvedAddress, plan.requestedAmountRaw]
    })
  });
}

function resolveTargetChain(plan: TransferPlan): Chain {
  if (plan.targetChain.chain) {
    return plan.targetChain.chain;
  }

  const mappedChain =
    LIFI_CHAIN_NAME_TO_VIEM_CHAIN[plan.targetChain.key] ??
    LIFI_CHAIN_NAME_TO_VIEM_CHAIN[plan.targetAsset.chainKey];

  if (mappedChain) {
    return mappedChain;
  }

  throw new ExecutionError(
    `Unsupported target chain for final transfer: ${plan.targetChain.key} (${plan.targetChain.id}).`
  );
}
