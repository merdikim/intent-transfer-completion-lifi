import { DEFAULT_CONFIG } from "./constants.js";
export const getSupportedChains = async () => {
    try {
        const { chains } = await fetch(`${DEFAULT_CONFIG.lifiBaseUrl}/chains`).then((res) => res.json());
        const evmChains = chains.filter((chain) => chain.chainType === "EVM");
        return evmChains;
    }
    catch (error) {
        console.error("Error fetching supported chains:", error);
        throw new Error("Unable to load supported chains from LI.FI");
    }
};
export const getSupportedTokens = async (chain) => {
    try {
        const { tokens } = await fetch(`${DEFAULT_CONFIG.lifiBaseUrl}/tokens`).then((res) => res.json());
        return (tokens[chain] ?? []);
    }
    catch (error) {
        console.error("Error fetching supported tokens:", error);
        throw new Error("Unable to load supported tokens from LI.FI");
    }
};
export const pluginConfigSchema = {
    type: "object",
    properties: {
        lifiApiKey: { type: "string" },
        lifiBaseUrl: { type: "string", default: "https://li.quest/v1" },
        integrator: { type: "string", default: "openclaw-intent-transfer" },
        routeFromAmountBufferBps: { type: "number", default: 500 },
    }
};
export function loadConfig(config) {
    return {
        ...DEFAULT_CONFIG,
        ...config,
        rpcUrls: {
            ...DEFAULT_CONFIG.rpcUrls,
            ...config?.rpcUrls
        },
        minNativeReserve: {
            ...DEFAULT_CONFIG.minNativeReserve,
            ...config?.minNativeReserve
        }
    };
}
export async function getChainByAlias(input) {
    const normalized = input.trim().toLowerCase();
    const chains = await getSupportedChains();
    if (!chains) {
        throw new Error("Unable to load supported chains from LI.FI");
    }
    return Object.values(chains).find((chain) => chain.key === normalized || chain.name.toLowerCase() === normalized || normalized.includes(chain.key) || normalized.includes(chain.name.toLowerCase()));
}
//# sourceMappingURL=config.js.map