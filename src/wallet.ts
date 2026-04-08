import { MissingSignerError } from "./errors.js";
import type { Address } from "viem";
import type { LocalWalletBinding, NativeToolContext, OpenClawWalletProvider } from "./types.js";

function isWalletClient(candidate: unknown): candidate is NonNullable<OpenClawWalletProvider["walletClient"]> {
  return typeof candidate === "object" && candidate !== null && "sendTransaction" in candidate;
}

async function resolveFromProvider(
  provider?: OpenClawWalletProvider
): Promise<NonNullable<OpenClawWalletProvider["walletClient"]> | undefined> {
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

export async function resolveLocalWallet(context?: NativeToolContext): Promise<LocalWalletBinding> {
  const walletClient =
    (await resolveFromProvider(context)) ??
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
    address: address as Address,
    walletClient
  };
}
