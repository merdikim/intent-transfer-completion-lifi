import { encodeFunctionData, erc20Abi } from "viem";
import { MissingSignerError } from "./errors.js";
export async function sendFinalTransfer(plan, _config, localWallet) {
    if (!localWallet) {
        throw new MissingSignerError();
    }
    if (plan.targetAsset.isNative) {
        return localWallet.walletClient.sendTransaction({
            account: localWallet.address,
            chain: SUPPORTED_CHAINS[plan.targetChain.key].chain,
            to: plan.recipient.resolvedAddress,
            value: plan.requestedAmountRaw
        });
    }
    return localWallet.walletClient.sendTransaction({
        account: localWallet.address,
        chain: SUPPORTED_CHAINS[plan.targetChain.key].chain,
        to: plan.targetAsset.address,
        data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [plan.recipient.resolvedAddress, plan.requestedAmountRaw]
        })
    });
}
//# sourceMappingURL=finalTransfer.js.map