import { createPublicClient, erc20Abi, formatUnits, getAddress, http, zeroAddress } from "viem";
import { getSupportedChains, getSupportedTokens } from "./config.js";
import { LIFI_CHAIN_NAME_TO_VIEM_CHAIN, NATIVE_TOKEN_ADDRESS } from "./constants.js";
function clientFor(chain, rpcUrl) {
    const transportUrl = chain?.rpcUrls.default.http[0] ?? rpcUrl;
    return createPublicClient({
        chain,
        transport: http(transportUrl)
    });
}
export async function getWalletBalances(ownerAddress) {
    const chains = await getSupportedChains();
    const chainBalances = await Promise.allSettled(Object.values(chains).map(async (chain) => {
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
        const nativePosition = {
            chainId: chain.id,
            chainKey: chain.key,
            token: {
                symbol: chain.nativeToken.symbol,
                address: NATIVE_TOKEN_ADDRESS,
                decimals: chain.nativeToken.decimals,
                chainId: chain.id,
                chainKey: chain.key,
                isNative: true
            },
            rawAmount: nativeAmount,
            formattedAmount: formatUnits(nativeAmount, chain.nativeToken.decimals)
        };
        const erc20Tokens = dedupeTokens(tokens.filter((token) => token.address !== NATIVE_TOKEN_ADDRESS));
        if (erc20Tokens.length === 0) {
            return [nativePosition];
        }
        const multicallAddress = client.chain?.contracts?.multicall3?.address;
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
                        chainKey: chain.key,
                        isNative: false
                    },
                    rawAmount,
                    formattedAmount: formatUnits(rawAmount, token.decimals)
                }
            ];
        });
        return [nativePosition, ...tokenPositions];
    }));
    const balances = chainBalances.flatMap((result, index) => {
        if (result.status === "fulfilled")
            return result.value;
        const chain = Object.values(chains)[index];
        console.error(`Chain failed: ${chain?.key}`, result.reason);
        return [];
    });
    return {
        raw: balances,
        formatted: balances.filter((balance) => Number(balance.formattedAmount) > 0)
    };
}
export async function getAssetBalance(ownerAddress, asset) {
    const viemChain = LIFI_CHAIN_NAME_TO_VIEM_CHAIN[asset.chainKey];
    if (!viemChain) {
        throw new Error(`Unsupported chain key: ${asset.chainKey}`);
    }
    const client = clientFor(viemChain, "");
    if (asset.address === zeroAddress) {
        return client.getBalance({ address: ownerAddress });
    }
    return (await client.readContract({
        abi: erc20Abi,
        address: asset.address,
        functionName: "balanceOf",
        args: [ownerAddress]
    }));
}
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
//# sourceMappingURL=balances.js.map