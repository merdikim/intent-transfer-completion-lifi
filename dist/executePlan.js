import { createPublicClient, getAddress, http, } from "viem";
import { getAssetBalance } from "./balances.js";
import { loadConfig, getSupportedChains } from "./config.js";
import { MissingSignerError, ExecutionError } from "./errors.js";
import { LIFI_CHAIN_NAME_TO_VIEM_CHAIN } from "./constants.js";
import { HttpLifiClient } from "./lifiClient.js";
import { sendFinalTransfer } from "./finalTransfer.js";
import { waitForBalanceIncrease } from "./statusTracker.js";
export async function executeTransferPlan(plan, localWallet) {
    if (!localWallet) {
        throw new MissingSignerError();
    }
    const transactions = [];
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
async function executeRouteStep(step, ownerAddress, localWallet) {
    const config = loadConfig();
    const lifiClient = new HttpLifiClient(config);
    const supportedChains = await getSupportedChains();
    const chain = supportedChains.find((item) => item.id === step.action.fromChainId);
    const viemChain = chain ? LIFI_CHAIN_NAME_TO_VIEM_CHAIN[chain.key] : undefined;
    if (!chain || !viemChain) {
        throw new ExecutionError(`Unsupported route step chain ${step.action.fromChainId}`);
    }
    const rpcUrl = config.rpcUrls[chain.key];
    const publicClient = createPublicClient({
        chain: viemChain,
        transport: http(rpcUrl ?? viemChain.rpcUrls.default.http[0])
    });
    const walletClient = localWallet.getWalletClient(viemChain, rpcUrl);
    const transactions = [];
    const populatedStep = await lifiClient.populateStepTransaction({
        ...step,
        action: {
            ...step.action,
            fromAddress: step.action.fromAddress ?? ownerAddress,
            toAddress: step.action.toAddress ?? ownerAddress
        }
    });
    const approvalAddress = populatedStep.estimate?.approvalAddress;
    const fromTokenAddress = getAddress(populatedStep.action.fromToken.address);
    // if (approvalAddress && fromTokenAddress !== zeroAddress) {
    //   const allowance = (await publicClient.readContract({
    //     abi: erc20Abi,
    //     address: fromTokenAddress,
    //     functionName: "allowance",
    //     args: [ownerAddress, approvalAddress]
    //   })) as bigint;
    //   console.log(allowance)
    //   if (allowance < BigInt(populatedStep.action.fromAmount)) {
    //     const approvalHash = await walletClient.sendTransaction({
    //       account: localWallet.address,
    //       chain: viemChain,
    //       kzg: undefined,
    //       to: fromTokenAddress,
    //       data: encodeFunctionData({
    //         abi: erc20Abi,
    //         functionName: "approve",
    //         args: [approvalAddress, maxUint256]
    //       })
    //     });
    //     await publicClient.waitForTransactionReceipt({ hash: approvalHash });
    //     transactions.push({ chainId: chain.id, hash: approvalHash, kind: "approval" });
    //   }
    // }
    const transactionRequest = populatedStep.transactionRequest;
    if (!transactionRequest) {
        throw new ExecutionError(`LI.FI route step for ${populatedStep.toolDetails?.name ?? populatedStep.tool ?? "unknown tool"} did not include a transaction request after stepTransaction population.`);
    }
    const txHash = await walletClient.sendTransaction({
        chain: viemChain,
        kzg: undefined,
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