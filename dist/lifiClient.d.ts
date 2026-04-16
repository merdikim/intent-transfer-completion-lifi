import type { Address } from "viem";
import type { LifiClient, LifiToken, PluginConfig, RoutePlan, RouteQuote } from "./types.js";
export type { LifiClient } from "./types.js";
export declare class HttpLifiClient implements LifiClient {
    private readonly config;
    constructor(config: PluginConfig);
    getTokens(chainId: number): Promise<LifiToken[]>;
    getQuote(params: {
        fromChain: number;
        toChain: number;
        fromToken: Address;
        toToken: Address;
        fromAddress: Address;
        fromAmount: bigint;
        toAddress?: Address;
    }): Promise<RouteQuote>;
    getRoutes(params: {
        fromChain: number;
        toChain: number;
        fromToken: Address;
        toToken: Address;
        fromAddress: Address;
        fromAmount: bigint;
        toAddress?: Address;
    }): Promise<RoutePlan>;
    getStatus(params: Record<string, string>): Promise<unknown>;
    private request;
}
