import type { ChainMetadata, PluginConfig, SupportedToken } from "./types.js";
export declare function ensureLifiSdkConfigured(config?: Partial<PluginConfig>): void;
export declare const getSupportedChains: () => Promise<Array<ChainMetadata>>;
export declare const getSupportedTokens: (chain: number) => Promise<SupportedToken[]>;
export declare const pluginConfigSchema: {
    readonly type: "object";
    readonly properties: {};
};
export declare function loadConfig(config?: Partial<PluginConfig>): PluginConfig;
export declare function getChainByAlias(input: string): Promise<ChainMetadata | undefined>;
