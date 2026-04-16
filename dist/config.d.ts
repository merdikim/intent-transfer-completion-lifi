import type { ChainMetadata, PluginConfig, SupportedToken } from "./types.js";
export declare const getSupportedChains: () => Promise<Array<ChainMetadata>>;
export declare const getSupportedTokens: (chain: number) => Promise<SupportedToken[]>;
export declare const pluginConfigSchema: {
    readonly type: "object";
    readonly properties: {
        readonly lifiApiKey: {
            readonly type: "string";
        };
        readonly lifiBaseUrl: {
            readonly type: "string";
            readonly default: "https://li.quest/v1";
        };
        readonly integrator: {
            readonly type: "string";
            readonly default: "openclaw-intent-transfer";
        };
    };
};
export declare function loadConfig(config?: Partial<PluginConfig>): PluginConfig;
export declare function getChainByAlias(input: string): Promise<ChainMetadata | undefined>;
