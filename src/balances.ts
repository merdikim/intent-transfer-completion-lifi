import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  getAddress,
  http,
  zeroAddress
} from "viem";
import type { Address, Chain, PublicClient } from "viem";
import { getSupportedChains, getSupportedTokens, loadConfig } from "./config.js";
import type { ChainMetadata } from "./types.js";
import type { AssetRef, BalancePosition, BalancesResult, SupportedToken } from "./types.js";
import { COINS, LIFI_CHAIN_NAME_TO_VIEM_CHAIN } from "./constants.js";

function clientFor(chain: Chain, rpcUrl: string | undefined): PublicClient {
  const transportUrl = rpcUrl ?? chain.rpcUrls.default.http[0];

  return createPublicClient({
    chain,
    transport: http(transportUrl)
  });
}

export async function getWalletBalances(
  ownerAddress: Address
): Promise<BalancesResult> {
  const chains = await getSupportedChains();

  const chainBalances = await Promise.allSettled(
    Object.values(chains).map(async (chain) => {

      if (!chain.nativeToken) {
        return [];
      }

      const viemChain = LIFI_CHAIN_NAME_TO_VIEM_CHAIN[chain.key];

      // If there's no viem chain mapping, we won't be able to fetch balances for this chain, so we skip it.  
      // This is expected for chains that LI.FI supports but we haven't added to our mapping yet. 
      // Or chains that do not support multicall (since we use multicall to fetch all token balances in parallel)
      if (!viemChain) {
        //console.log(`Skipping unsupported chain: ${chain.key}`);
        return [];
      }

      const tokens = await getSupportedTokens(chain.id);
      const erc20Tokens = dedupeTokens(tokens.filter((token) => token.address !== zeroAddress));

      if (erc20Tokens.length === 0) {
        return []//[nativePosition];
      }

      const matchedAssets = COINS.flatMap((coin) => {
        const token = erc20Tokens.find(
          (supportedToken) => supportedToken.symbol.toUpperCase() === coin.toUpperCase()
        );

        if (!token) {
          //console.warn(`Stablecoin ${coin} not found for chain ${chain.key}`);
          return [];
        }

        return [toAssetRef(token, chain.key)];
      });

      const coinPositions = (
        await Promise.all(
          matchedAssets.map(async (asset) => {
            const balance = await getAssetBalance(ownerAddress, asset);

            return {
              chainId: chain.id,
              chainKey: chain.key,
              token: asset,
              rawAmount: balance,
              formattedAmount: formatUnits(balance, asset.decimals)
            } satisfies BalancePosition;
          })
        )
      ).filter((position) => position.rawAmount > 0n);

      return coinPositions //[nativePosition, ...coinPositions]; //[nativePosition, ...tokenPositions];
    })
  );

  const balances = chainBalances.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;

    const chain = Object.values(chains)[index];
    console.error(`Chain failed: ${chain?.key}`, result.reason);
    return [];
  });

  return {
    all: balances,
    filtered: balances.filter((balance) => Number(balance.formattedAmount) > 0)
  }
}

export async function getAssetBalance(
  ownerAddress: Address,
  asset: AssetRef
): Promise<bigint> {
  const supportedChains = await getSupportedChains();
  const lifiChain = supportedChains.find((chain) => chain.key === asset.chainKey || chain.id === asset.chainId);
  const viemChain = LIFI_CHAIN_NAME_TO_VIEM_CHAIN[asset.chainKey];
  if (!viemChain) {
    throw new Error(`Unsupported chain key: ${asset.chainKey}`);
  }
  const client = clientFor(viemChain, resolveRpcUrl(lifiChain, viemChain));
  if (asset.address === zeroAddress) {
    return client.getBalance({ address: ownerAddress });
  }

  return (await client.readContract({
    abi: erc20Abi,
    address: asset.address,
    functionName: "balanceOf",
    args: [ownerAddress]
  })) as bigint;
}

function dedupeTokens(tokens: SupportedToken[]): SupportedToken[] {
  const seen = new Set<string>();
  const deduped: SupportedToken[] = [];

  for (const token of tokens) {
    const address = token.address.toLowerCase();
    if (seen.has(address)) {
      continue;
    }

    seen.add(address);
    deduped.push(token);
  }

  return deduped;
}

function toAssetRef(token: SupportedToken, chainKey: string): AssetRef {
  return {
    symbol: token.symbol,
    address: getAddress(token.address),
    decimals: token.decimals,
    chainId: token.chainId,
    chainKey
  };
}

function resolveRpcUrl(
  lifiChain: ChainMetadata | undefined,
  viemChain: Chain
): string | undefined {
  return (
    lifiChain?.metamask?.rpcUrls?.[0] ??
    viemChain.rpcUrls.default.http[0]
  );
}
