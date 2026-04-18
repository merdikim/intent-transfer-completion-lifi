import { EVM, config as lifiSdkConfig, executeRoute } from "@lifi/sdk";
import type { Process, RouteExtended } from "@lifi/sdk";
import type { ChainId } from "@lifi/types";

import { getAssetBalance } from "./balances.js";
import { ensureLifiSdkConfigured, getSupportedChains, loadConfig } from "./config.js";
import { ExecutionError, MissingSignerError } from "./errors.js";
import { LIFI_CHAIN_NAME_TO_VIEM_CHAIN } from "./constants.js";
import { sendFinalTransfer } from "./finalTransfer.js";
import { waitForBalanceIncrease } from "./statusTracker.js";
import type { Hex } from "viem";
import type {
  ExecutedTransaction,
  ExecutionResult,
  LocalWalletBinding,
  TransferPlan
} from "./types.js";

export async function executeTransferPlan(
  plan: TransferPlan,
  localWallet?: LocalWalletBinding
): Promise<ExecutionResult> {
  if (!localWallet) {
    throw new MissingSignerError();
  }

  const transactions: ExecutedTransaction[] = [];

  if (plan.route) {
    const preRouteTargetBalance = await getAssetBalance(plan.ownerAddress, plan.targetAsset);
    const executedRoute = await executePlannedRoute(plan, localWallet);
    transactions.push(...extractExecutedTransactions(executedRoute));

    await waitForBalanceIncrease({
      ownerAddress: plan.ownerAddress,
      asset: plan.targetAsset,
      minimumBalance: preRouteTargetBalance + plan.shortfallRaw,
    });
  }

  const finalTransferHash = await sendFinalTransfer(plan, localWallet);
  transactions.push({
    chainId: plan.targetChain.id,
    hash: finalTransferHash,
    kind: "final-transfer"
  });

  return {
    executed: true,
    plan,
    transactions,
    finalTransferHash,
    summary: buildSummary(plan)
  };
}

async function executePlannedRoute(
  plan: TransferPlan,
  localWallet: LocalWalletBinding
): Promise<RouteExtended> {
  const config = loadConfig();
  ensureLifiSdkConfigured(config);

  lifiSdkConfig.setProviders([
    EVM({
      getWalletClient: async () => getWalletClientForChain(plan.route!.fromChainId, localWallet),
      switchChain: async (chainId) => getWalletClientForChain(chainId, localWallet),
    }),
  ]);

  try {
    return await executeRoute(plan.route!.sdkRoute, {
      switchChainHook: async (chainId) => getWalletClientForChain(chainId, localWallet),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown LI.FI SDK execution error";
    throw new ExecutionError(`LI.FI route execution failed: ${message}`);
  }
}

async function getWalletClientForChain(chainId: ChainId, localWallet: LocalWalletBinding) {
  const config = loadConfig();
  const supportedChains = await getSupportedChains();
  const chain = supportedChains.find((item) => item.id === chainId);
  const viemChain = chain ? LIFI_CHAIN_NAME_TO_VIEM_CHAIN[chain.key] : undefined;

  if (!chain || !viemChain) {
    throw new ExecutionError(`Unsupported route execution chain ${chainId}`);
  }

  return localWallet.getWalletClient(viemChain);
}

function extractExecutedTransactions(route: RouteExtended): ExecutedTransaction[] {
  const transactions: ExecutedTransaction[] = [];
  const seen = new Set<string>();

  for (const step of route.steps) {
    for (const process of step.execution?.process ?? []) {
      const transaction = toExecutedTransaction(process);
      if (!transaction) {
        continue;
      }

      const key = `${transaction.kind}:${transaction.chainId}:${transaction.hash}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      transactions.push(transaction);
    }
  }

  return transactions;
}

function toExecutedTransaction(process: Process): ExecutedTransaction | undefined {
  if (!process.txHash || !process.chainId) {
    return undefined;
  }

  if (process.type === "TOKEN_ALLOWANCE") {
    return {
      chainId: process.chainId,
      hash: process.txHash as Hex,
      kind: "approval"
    };
  }

  return {
    chainId: process.chainId,
    hash: process.txHash as Hex,
    kind: "route-step"
  };
}

function buildSummary(plan: TransferPlan): string {
  const routeSummary = plan.route
    ? `LI.FI route with ${plan.route.steps.length} step(s) planned before the final transfer.`
    : "No route required because the destination chain already had sufficient balance.";

  return `Transfer completed. ${routeSummary}`;
}
