import { createPublicClient, encodeFunctionData, erc20Abi, getAddress, http, maxUint256 } from "viem";
import { getAssetBalance } from "./balances.js";
import { MissingSignerError, ExecutionError } from "./errors.js";
import { sendFinalTransfer } from "./finalTransfer.js";
import { waitForBalanceIncrease } from "./statusTracker.js";
import { SUPPORTED_CHAINS } from "./config.js";
export async function executeTransferPlan(plan, config, localWallet) {
    if (!localWallet) {
        throw new MissingSignerError();
    }
    const transactions = [];
    if (plan.route) {
        const preRouteTargetBalance = await getAssetBalance(plan.ownerAddress, plan.targetAsset, config);
        for (const step of plan.route.steps) {
            const stepTransactions = await executeRouteStep(step, localWallet.address, config, localWallet);
            transactions.push(...stepTransactions);
        }
        await waitForBalanceIncrease({
            ownerAddress: plan.ownerAddress,
            asset: plan.targetAsset,
            minimumBalance: preRouteTargetBalance + plan.shortfallRaw,
            config
        });
    }
    const finalTransferHash = await sendFinalTransfer(plan, config, localWallet);
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
async function executeRouteStep(step, ownerAddress, config, localWallet) {
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
    const transactions = [];
    const approvalAddress = step.estimate?.approvalAddress;
    if (approvalAddress && step.action.fromToken.address !== getAddress("0x0000000000000000000000000000000000000000")) {
        const allowance = (await publicClient.readContract({
            abi: erc20Abi,
            address: step.action.fromToken.address,
            functionName: "allowance",
            args: [ownerAddress, approvalAddress]
        }));
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
        throw new ExecutionError(`LI.FI route step for ${step.toolDetails?.name ?? step.tool ?? "unknown tool"} did not include a transaction request.`);
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
    transactions.push({ chainId: chain.id, hash: txHash, kind: "route-step" });
    return transactions;
}
function buildSummary(plan) {
    const routeSummary = plan.route
        ? `LI.FI route with ${plan.route.steps.length} step(s) planned before the final transfer.`
        : "No route required because the destination chain already had sufficient balance.";
    return `Transfer completed. ${routeSummary}`;
}
//# sourceMappingURL=executePlan.js.map