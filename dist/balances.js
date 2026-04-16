import { createPublicClient, erc20Abi, formatUnits, getAddress, http } from "viem";
import { getSupportedChains, getSupportedTokens } from "./config.js";
import { LIFI_CHAIN_NAME_TO_VIEM_CHAIN, NATIVE_TOKEN_ADDRESS } from "./constants.js";
function clientFor(chainKey, rpcUrl) {
    const chain = LIFI_CHAIN_NAME_TO_VIEM_CHAIN[chainKey];
    const transportUrl = chain?.rpcUrls.default.http[0] ?? rpcUrl;
    if (!transportUrl) {
        throw new Error(`Missing RPC URL for chain ${chainKey}`);
    }
    return createPublicClient({
        chain,
        transport: http(transportUrl)
    });
}
export async function getWalletBalances(ownerAddress) {
    const chains = await getSupportedChains();
    console.log('starting...');
    const chainBalances = await Promise.all(Object.values(chains).map(async (chain) => {
        if (!chain.nativeToken) {
            return [];
        }
        const rpcUrl = chain?.metamask?.rpcUrls?.[0];
        const tokens = await getSupportedTokens(chain.id);
        const client = clientFor(chain.key, rpcUrl);
        const nativeAmount = await client.getBalance({ address: ownerAddress });
        const nativePosition = {
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
        const contractResults = await client.multicall({
            allowFailure: true,
            contracts: erc20Tokens.map((token) => ({
                abi: erc20Abi,
                address: getAddress(token.address),
                functionName: "balanceOf",
                args: [ownerAddress]
            }))
        });
        console.log(contractResults);
        const tokenPositions = contractResults.flatMap((result, index) => {
            if (result.status !== "success") {
                return [];
            }
            const token = erc20Tokens[index];
            const normalizedAddress = getAddress(token.address);
            const rawAmount = result.result;
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
                }
            ];
        });
        return [nativePosition, ...tokenPositions];
    }));
    console.log("chainBalances", chainBalances);
    return chainBalances.flat();
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
function dedupeTokens(tokens) {
    const seen = new Set();
    const deduped = [];
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
// function normalizeTokenAddress(address: string): Address {
//   return address === NATIVE_TOKEN_ADDRESS ? NATIVE_TOKEN_ADDRESS : getAddress(address);
// }
//# sourceMappingURL=balances.js.map