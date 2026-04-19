import { encodeFunctionData, erc20Abi, zeroAddress, } from "viem";
import { LIFI_CHAIN_NAME_TO_VIEM_CHAIN } from "./constants.js";
import { ExecutionError, MissingSignerError } from "./errors.js";
export async function sendFinalTransfer(plan, localWallet) {
    if (!localWallet) {
        throw new MissingSignerError();
    }
    const targetChain = resolveTargetChain(plan);
    const walletClient = localWallet.getWalletClient(targetChain);
    if (plan.targetAsset.address === zeroAddress) {
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
function resolveTargetChain(plan) {
    if (plan.targetChain.chain) {
        return plan.targetChain.chain;
    }
    const mappedChain = LIFI_CHAIN_NAME_TO_VIEM_CHAIN[plan.targetChain.key] ??
        LIFI_CHAIN_NAME_TO_VIEM_CHAIN[plan.targetAsset.chainKey];
    if (mappedChain) {
        return mappedChain;
    }
    throw new ExecutionError(`Unsupported target chain for final transfer: ${plan.targetChain.key} (${plan.targetChain.id}).`);
}
//# sourceMappingURL=finalTransfer.js.map