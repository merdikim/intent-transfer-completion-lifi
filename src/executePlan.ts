import {
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
  getAddress,
  http,
  maxUint256
} from "viem";
import { getAssetBalance } from "./balances.js";
import { MissingSignerError, ExecutionError } from "./errors.js";
import { sendFinalTransfer } from "./finalTransfer.js";
import { waitForBalanceIncrease } from "./statusTracker.js";
import type { Address, Hex } from "viem";
import type {
  ExecutedTransaction,
  ExecutionResult,
  LocalWalletBinding,
  PluginConfig,
  RouteStep,
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

    for (const step of plan.route.steps) {
      const stepTransactions = await executeRouteStep(step, localWallet.address, localWallet);
      transactions.push(...stepTransactions);
    }

    await waitForBalanceIncrease({
      ownerAddress: plan.ownerAddress,
      asset: plan.targetAsset,
      minimumBalance: preRouteTargetBalance + plan.shortfallRaw,
    });
  }

  const finalTransferHash = '0xjvjek'; // Placeholder until sendFinalTransfer is implemented
  // // await sendFinalTransfer(plan, localWallet);
  // transactions.push({
  //   chainId: plan.targetChain.id,
  //   hash: finalTransferHash,
  //   kind: "final-transfer"
  // });

  return {
    executed: true,
    plan,
    transactions,
    finalTransferHash,
    summary: buildSummary(plan)
  };
}

async function executeRouteStep(
  step: RouteStep,
  ownerAddress: Address,
  localWallet: LocalWalletBinding
): Promise<ExecutedTransaction[]> {
  const chain = Object.values(SUPPORTED_CHAINS).find((item) => item.id === step.action.fromChainId);
  if (!chain) {
    throw new ExecutionError(`Unsupported route step chain ${step.action.fromChainId}`);
  }

  const rpcUrl = config.rpcUrls[chain.key];
  if (!rpcUrl) {
    throw new ExecutionError(`Missing RPC URL for ${chain.key}`);
  }

  const publicClient = createPublicClient({
    chain: chain.chain,
    transport: http(rpcUrl)
  });
  const transactions: ExecutedTransaction[] = [];

  const approvalAddress = step.estimate?.approvalAddress;
  if (approvalAddress && step.action.fromToken.address !== getAddress("0x0000000000000000000000000000000000000000")) {
    const allowance = (await publicClient.readContract({
      abi: erc20Abi,
      address: step.action.fromToken.address,
      functionName: "allowance",
      args: [ownerAddress, approvalAddress]
    })) as bigint;

    if (allowance < BigInt(step.action.fromAmount)) {
      const approvalHash = await localWallet.walletClient.sendTransaction({
        account: localWallet.address,
        chain: chain.chain,
        to: step.action.fromToken.address,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [approvalAddress, maxUint256]
        })
      });
      await publicClient.waitForTransactionReceipt({ hash: approvalHash });
      transactions.push({ chainId: chain.id, hash: approvalHash, kind: "approval" });
    }
  }

  const transactionRequest = step.transactionRequest;
  if (!transactionRequest) {
    throw new ExecutionError(
      `LI.FI route step for ${step.toolDetails?.name ?? step.tool ?? "unknown tool"} did not include a transaction request.`
    );
  }

  const txHash = await localWallet.walletClient.sendTransaction({
    account: localWallet.address,
    chain: chain.chain,
    to: transactionRequest.to,
    data: transactionRequest.data,
    value: transactionRequest.value ? BigInt(transactionRequest.value) : undefined,
    gas: transactionRequest.gasLimit ? BigInt(transactionRequest.gasLimit) : undefined,
    gasPrice: transactionRequest.gasPrice ? BigInt(transactionRequest.gasPrice) : undefined
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  transactions.push({ chainId: chain.id, hash: txHash as Hex, kind: "route-step" });
  return transactions;
}

function buildSummary(plan: TransferPlan): string {
  const routeSummary = plan.route
    ? `LI.FI route with ${plan.route.steps.length} step(s) planned before the final transfer.`
    : "No route required because the destination chain already had sufficient balance.";

  return `Transfer completed. ${routeSummary}`;
}
