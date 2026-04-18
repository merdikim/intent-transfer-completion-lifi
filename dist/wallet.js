import { createWalletClient, http } from "viem";
import { readFileSync } from "fs";
import { privateKeyToAccount } from "viem/accounts";
export async function resolveLocalWallet(walletPath) {
    try {
        const privateKey = readFileSync(walletPath, "utf-8");
        const account = privateKeyToAccount(`0x${privateKey.trim()}`);
        return {
            account,
            address: account.address,
            getWalletClient: (chain, rpcUrl) => createWalletClient({
                account,
                chain,
                transport: http(rpcUrl ?? chain.rpcUrls.default.http[0])
            })
        };
    }
    catch (error) {
        console.error("Error resolving local wallet:", error);
        throw new Error("Failed to resolve local wallet");
    }
}
//# sourceMappingURL=wallet.js.map