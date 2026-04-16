import { MissingSignerError } from "./errors.js";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
export async function resolveLocalWallet(walletPath) {
    try {
        //const privateKey = readFileSync(walletPath, "utf-8");
        const prvateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; //This private key is for testing purposes only and should not be used in production. It is one of the default accounts provided by Hardhat for local development.
        const account = privateKeyToAccount(prvateKey);
        const walletClient = createWalletClient({
            account,
            chain: mainnet,
            transport: http()
        });
        if (!walletClient) {
            throw new MissingSignerError();
        }
        return {
            address: account.address,
            walletClient
        };
    }
    catch (error) {
        console.error("Error resolving local wallet:", error);
        throw new Error("Failed to resolve local wallet");
    }
}
//# sourceMappingURL=wallet.js.map