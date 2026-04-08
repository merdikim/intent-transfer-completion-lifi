import { arbitrum, base, mainnet, optimism, polygon } from "viem/chains";
import { parseUnits } from "viem";
export const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";
export const SUPPORTED_CHAINS = {
    ethereum: {
        key: "ethereum",
        id: 1,
        name: "Ethereum",
        chain: mainnet,
        nativeSymbol: "ETH",
        aliases: ["ethereum", "eth", "mainnet"]
    },
    base: {
        key: "base",
        id: 8453,
        name: "Base",
        chain: base,
        nativeSymbol: "ETH",
        aliases: ["base"]
    },
    arbitrum: {
        key: "arbitrum",
        id: 42161,
        name: "Arbitrum",
        chain: arbitrum,
        nativeSymbol: "ETH",
        aliases: ["arbitrum", "arb", "arbitrum one"]
    },
    optimism: {
        key: "optimism",
        id: 10,
        name: "Optimism",
        chain: optimism,
        nativeSymbol: "ETH",
        aliases: ["optimism", "op"]
    },
    polygon: {
        key: "polygon",
        id: 137,
        name: "Polygon",
        chain: polygon,
        nativeSymbol: "POL",
        aliases: ["polygon", "matic", "pol"]
    }
};
export const DEFAULT_TOKEN_REGISTRY = {
    ETH: {
        symbol: "ETH",
        decimals: 18,
        addresses: {
            ethereum: NATIVE_TOKEN_ADDRESS,
            base: NATIVE_TOKEN_ADDRESS,
            arbitrum: NATIVE_TOKEN_ADDRESS,
            optimism: NATIVE_TOKEN_ADDRESS
        },
        nativeOn: ["ethereum", "base", "arbitrum", "optimism"]
    },
    POL: {
        symbol: "POL",
        decimals: 18,
        addresses: {
            polygon: NATIVE_TOKEN_ADDRESS
        },
        nativeOn: ["polygon"]
    },
    USDC: {
        symbol: "USDC",
        decimals: 6,
        addresses: {
            ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            base: "0x833589fCD6EDB6E08f4c7C32D4f71b54bdA02913",
            arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            optimism: "0x0b2C639c533813f4Aa9D7837CaF62653d097Ff85",
            polygon: "0x3c499c542cEF5E3811e1192cD54b4e5eA5f91fA5"
        }
    },
    DAI: {
        symbol: "DAI",
        decimals: 18,
        addresses: {
            ethereum: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            arbitrum: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
            optimism: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
            polygon: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"
        }
    },
    WETH: {
        symbol: "WETH",
        decimals: 18,
        addresses: {
            ethereum: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
            base: "0x4200000000000000000000000000000000000006",
            arbitrum: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
            optimism: "0x4200000000000000000000000000000000000006",
            polygon: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"
        }
    }
};
export const pluginConfigSchema = {
    type: "object",
    properties: {
        lifiApiKey: { type: "string" },
        lifiBaseUrl: { type: "string", default: "https://li.quest/v1" },
        integrator: { type: "string", default: "openclaw-intent-transfer" },
        defaultSlippageBps: { type: "integer", default: 100 },
        rpcUrls: {
            type: "object",
            properties: {
                ethereum: { type: "string" },
                base: { type: "string" },
                arbitrum: { type: "string" },
                optimism: { type: "string" },
                polygon: { type: "string" }
            }
        },
        minNativeReserve: {
            type: "object",
            properties: {
                ethereum: { type: "string", default: "0.003" },
                base: { type: "string", default: "0.002" },
                arbitrum: { type: "string", default: "0.002" },
                optimism: { type: "string", default: "0.002" },
                polygon: { type: "string", default: "1" }
            }
        }
    }
};
const DEFAULT_CONFIG = {
    lifiBaseUrl: "https://li.quest/v1",
    lifiApiKey: undefined,
    integrator: "openclaw-intent-transfer",
    defaultSlippageBps: 100,
    rpcUrls: {},
    minNativeReserve: {
        ethereum: "0.003",
        base: "0.002",
        arbitrum: "0.002",
        optimism: "0.002",
        polygon: "1"
    },
    routeStatusPollIntervalMs: 10_000,
    routeStatusTimeoutMs: 20 * 60 * 1000
};
export function loadConfig(overrides = {}) {
    return {
        ...DEFAULT_CONFIG,
        ...overrides,
        rpcUrls: { ...DEFAULT_CONFIG.rpcUrls, ...overrides.rpcUrls },
        minNativeReserve: { ...DEFAULT_CONFIG.minNativeReserve, ...overrides.minNativeReserve }
    };
}
export function getChainByAlias(input) {
    const normalized = input.trim().toLowerCase();
    return Object.values(SUPPORTED_CHAINS).find((chain) => chain.aliases.includes(normalized));
}
export function getChainById(chainId) {
    const found = Object.values(SUPPORTED_CHAINS).find((chain) => chain.id === chainId);
    if (!found) {
        throw new Error(`Unsupported chain id ${chainId}`);
    }
    return found;
}
export function reserveRawForChain(chainKey, config) {
    const reserve = config.minNativeReserve[chainKey] ?? "0";
    const decimals = chainKey === "polygon" ? 18 : 18;
    return parseUnits(reserve, decimals);
}
//# sourceMappingURL=config.js.map