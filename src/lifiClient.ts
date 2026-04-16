import type { Address } from "viem";

import { LifiApiError } from "./errors.js";
import type { LifiClient, LifiToken, PluginConfig, RequestOptions, RoutePlan, RouteQuote } from "./types.js";

export type { LifiClient } from "./types.js";

export class HttpLifiClient implements LifiClient {
  constructor(private readonly config: PluginConfig) {}

  async getTokens(chainId: number): Promise<LifiToken[]> {
    const response = await this.request<{ tokens?: Record<string, LifiToken> }>("/tokens", {
      query: { chains: chainId }
    });

    return Object.values(response.tokens ?? {});
  }

  async getQuote(params: {
    fromChain: number;
    toChain: number;
    fromToken: Address;
    toToken: Address;
    fromAddress: Address;
    fromAmount: bigint;
    toAddress?: Address;
  }): Promise<RouteQuote> {
    return this.request<RouteQuote>("/quote", {
      query: {
        fromChain: params.fromChain,
        toChain: params.toChain,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        fromAmount: params.fromAmount.toString()
      }
    });
  }

  async getRoutes(params: {
    fromChain: number;
    toChain: number;
    fromToken: Address;
    toToken: Address;
    fromAddress: Address;
    fromAmount: bigint;
    toAddress?: Address;
  }): Promise<RoutePlan> {
    const response = await this.request<{ routes?: RoutePlan[] }>("/advanced/routes", {
      method: "POST",
      body: {
        fromChainId: params.fromChain,
        toChainId: params.toChain,
        fromTokenAddress: params.fromToken,
        toTokenAddress: params.toToken,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        fromAmount: params.fromAmount.toString(),
        // options: {
        //   integrator: this.config.integrator,
        //   allowSwitchChain: true,
        //   maxPriceImpact: 0.2
        // }
      }
    });

    const route = response.routes?.[0];
    if (!route) {
      throw new LifiApiError("LI.FI did not return a route.");
    }

    return route;
  }

  async getStatus(params: Record<string, string>): Promise<unknown> {
    return this.request("/status", { query: params });
  }

  private async request<T>(path: string, options: RequestOptions): Promise<T> {
    const normalizedBase = this.config.lifiBaseUrl.endsWith("/")
      ? this.config.lifiBaseUrl
      : `${this.config.lifiBaseUrl}/`;
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    const url = new URL(normalizedPath, normalizedBase);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {};
    if (options.body) {
      headers["content-type"] = "application/json";
    }
    if (this.config.lifiApiKey) {
      headers["x-lifi-api-key"] = this.config.lifiApiKey;
    }

    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new LifiApiError(
        `LI.FI request failed with status ${response.status}${errorText ? `: ${errorText}` : ""}`
      );
    }

    return (await response.json()) as T;
  }
}
