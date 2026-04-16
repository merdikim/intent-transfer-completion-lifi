import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  getAddress,
  http
} from "viem";
import type { Address, Chain, PublicClient } from "viem";
import { getSupportedChains, getSupportedTokens } from "./config.js";
import type { BalancePosition, BalancesResult, SupportedToken } from "./types.js";
import { LIFI_CHAIN_NAME_TO_VIEM_CHAIN, NATIVE_TOKEN_ADDRESS } from "./constants.js";

function clientFor(chain: Chain, rpcUrl: string | undefined): PublicClient {
  const transportUrl = chain?.rpcUrls.default.http[0] ?? rpcUrl;

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
        console.log(`Skipping unsupported chain: ${chain.key}`);
        return [];
      }

      const rpcUrl = chain?.metamask?.rpcUrls?.[0];
      const tokens = await getSupportedTokens(chain.id);
      const client = clientFor(viemChain, rpcUrl);
      const nativeAmount = await client.getBalance({ address: ownerAddress });

      const nativePosition: BalancePosition = {
        chainId: chain.id,
        chainKey: chain.key,
        token: {
          symbol: chain.nativeToken.symbol,
          address: NATIVE_TOKEN_ADDRESS,
          decimals: chain.nativeToken.decimals,
          chainId: chain.id
        },
        rawAmount: nativeAmount,
        formattedAmount: formatUnits(nativeAmount, chain.nativeToken.decimals)
      };

      const erc20Tokens = dedupeTokens(tokens.filter((token) => token.address !== NATIVE_TOKEN_ADDRESS));

      if (erc20Tokens.length === 0) {
        return [nativePosition];
      }

      const multicallAddress =
      client.chain?.contracts?.multicall3?.address;
      if (!multicallAddress) {
        console.log(`Skipping multicall for chain ${chain.key} due to missing multicall address`);
        return [nativePosition];
      }

      const contractResults = await client.multicall({
        allowFailure: true,
        contracts: erc20Tokens.map((token) => ({
          abi: erc20Abi,
          address: getAddress(token.address),
          functionName: "balanceOf",
          args: [ownerAddress]
        }))
      });

      const tokenPositions = contractResults.flatMap((result, index) => {
        if (result.status !== "success") {
          return [];
        }

        const token = erc20Tokens[index];
        const normalizedAddress = getAddress(token.address);
        const rawAmount = result.result as bigint;

        return [
          {
            chainId: chain.id,
            chainKey: chain.key,
            token: {
              symbol: token.symbol,
              address: normalizedAddress,
              decimals: token.decimals,
              chainId: chain.id,
              //chainKey: chain.key,
              //isNative: false
            },
            rawAmount,
            formattedAmount: formatUnits(rawAmount, token.decimals)
          } satisfies BalancePosition
        ];
      });

      return [nativePosition, ...tokenPositions];
    })
  );

  const balances = chainBalances.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;

    const chain = Object.values(chains)[index];
    console.error(`Chain failed: ${chain?.key}`, result.reason);
    return [];
  });

  return {
    raw: balances,
    formatted: balances.filter((balance) => Number(balance.formattedAmount) > 0)
  }
}





// export async function getAssetBalance(
//   ownerAddress: Address,
//   asset: AssetRef,
//   config: PluginConfig
// ): Promise<bigint> {
//   const rpcUrl = config.rpcUrls[asset.chainKey];
//   if (!rpcUrl) {
//     throw new Error(`Missing RPC URL for ${asset.chainKey}`);
//   }

//   const client = clientFor(asset.chainKey, rpcUrl);
//   if (asset.isNative) {
//     return client.getBalance({ address: ownerAddress });
//   }

//   return (await client.readContract({
//     abi: erc20Abi,
//     address: asset.address,
//     functionName: "balanceOf",
//     args: [ownerAddress]
//   })) as bigint;
// }

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

