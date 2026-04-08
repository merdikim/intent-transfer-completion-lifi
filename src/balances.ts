import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  getAddress,
  http,
  zeroAddress
} from "viem";

import { DEFAULT_TOKEN_REGISTRY, NATIVE_TOKEN_ADDRESS, SUPPORTED_CHAINS } from "./config.js";
import type { Address, PublicClient } from "viem";
import type { AssetRef, BalancePosition, ChainKey, PluginConfig } from "./types.js";

function clientFor(chainKey: ChainKey, rpcUrl: string): PublicClient {
  return createPublicClient({
    chain: SUPPORTED_CHAINS[chainKey].chain,
    transport: http(rpcUrl)
  });
}

export async function getWalletBalances(
  ownerAddress: Address,
  config: PluginConfig
): Promise<BalancePosition[]> {
  const balances: BalancePosition[] = [];

  for (const [chainKey, rpcUrl] of Object.entries(config.rpcUrls) as Array<[ChainKey, string | undefined]>) {
    if (!rpcUrl) {
      continue;
    }

    const client = clientFor(chainKey, rpcUrl);
    const nativeAmount = await client.getBalance({ address: ownerAddress });
    const nativeSymbol = SUPPORTED_CHAINS[chainKey].nativeSymbol;
    balances.push({
      chainId: SUPPORTED_CHAINS[chainKey].id,
      chainKey,
      token: {
        symbol: nativeSymbol,
        address: NATIVE_TOKEN_ADDRESS,
        decimals: 18,
        chainId: SUPPORTED_CHAINS[chainKey].id,
        chainKey,
        isNative: true
      },
      rawAmount: nativeAmount,
      formattedAmount: formatUnits(nativeAmount, 18)
    });

    for (const registry of Object.values(DEFAULT_TOKEN_REGISTRY)) {
      const tokenAddress = registry.addresses[chainKey];
      if (!tokenAddress || tokenAddress === zeroAddress || registry.nativeOn?.includes(chainKey)) {
        continue;
      }

      const rawAmount = (await client.readContract({
        abi: erc20Abi,
        address: getAddress(tokenAddress),
        functionName: "balanceOf",
        args: [ownerAddress]
      })) as bigint;

      if (rawAmount === 0n) {
        continue;
      }

      balances.push({
        chainId: SUPPORTED_CHAINS[chainKey].id,
        chainKey,
        token: {
          symbol: registry.symbol,
          address: getAddress(tokenAddress),
          decimals: registry.decimals,
          chainId: SUPPORTED_CHAINS[chainKey].id,
          chainKey,
          isNative: tokenAddress === NATIVE_TOKEN_ADDRESS
        },
        rawAmount,
        formattedAmount: formatUnits(rawAmount, registry.decimals)
      });
    }
  }

  return balances;
}

export async function getAssetBalance(
  ownerAddress: Address,
  asset: AssetRef,
  config: PluginConfig
): Promise<bigint> {
  const rpcUrl = config.rpcUrls[asset.chainKey];
  if (!rpcUrl) {
    throw new Error(`Missing RPC URL for ${asset.chainKey}`);
  }

  const client = clientFor(asset.chainKey, rpcUrl);
  if (asset.isNative) {
    return client.getBalance({ address: ownerAddress });
  }

  return (await client.readContract({
    abi: erc20Abi,
    address: asset.address,
    functionName: "balanceOf",
    args: [ownerAddress]
  })) as bigint;
}
