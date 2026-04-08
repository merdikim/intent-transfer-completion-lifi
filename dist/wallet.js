import { MissingSignerError } from "./errors.js";
function isWalletClient(candidate) {
    return typeof candidate === "object" && candidate !== null && "sendTransaction" in candidate;
}
async function resolveFromProvider(provider) {
    if (!provider) {
        return undefined;
    }
    if (isWalletClient(provider.walletClient)) {
        return provider.walletClient;
    }
    if (provider.getWalletClient) {
        const candidate = await provider.getWalletClient();
        if (isWalletClient(candidate)) {
            return candidate;
        }
    }
    return undefined;
}
export async function resolveLocalWallet(context) {
    const walletClient = (await resolveFromProvider(context)) ??
        (await resolveFromProvider(context?.wallet)) ??
        (await resolveFromProvider(context?.openclaw));
    if (!walletClient) {
        throw new MissingSignerError();
    }
    const address = walletClient.account?.address ?? (await walletClient.getAddresses?.())?.[0];
    if (!address) {
        throw new MissingSignerError();
    }
    return {
        address: address,
        walletClient
    };
}
//# sourceMappingURL=wallet.js.map