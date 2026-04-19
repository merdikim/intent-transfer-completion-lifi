import { ChainType, config as lifiSdkConfig, createConfig, getChains, getTokens } from "@lifi/sdk";
import { DEFAULT_CONFIG } from "./constants.js";
let sdkInitialized = false;
export function ensureLifiSdkConfigured(config) {
    const resolvedConfig = loadConfig(config);
    const sdkConfig = {
        apiUrl: resolvedConfig.lifiBaseUrl,
        integrator: resolvedConfig.integrator,
    };
    if (!sdkInitialized) {
        createConfig(sdkConfig);
        sdkInitialized = true;
        return;
    }
    lifiSdkConfig.set(sdkConfig);
}
export const getSupportedChains = async () => {
    try {
        ensureLifiSdkConfigured();
        const chains = (await getChains({ chainTypes: [ChainType.EVM] }));
        return chains;
    }
    catch (error) {
        console.error("Error fetching supported chains:", error);
        throw new Error("Unable to load supported chains from LI.FI");
    }
};
export const getSupportedTokens = async (chain) => {
    try {
        ensureLifiSdkConfigured();
        const { tokens } = await getTokens({ chains: [chain] });
        return (tokens[chain] ?? []);
    }
    catch (error) {
        console.error("Error fetching supported tokens:", error);
        throw new Error("Unable to load supported tokens from LI.FI");
    }
};
export const pluginConfigSchema = {
    type: "object",
    properties: {}
};
export function loadConfig(config) {
    return {
        ...DEFAULT_CONFIG,
        ...config,
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