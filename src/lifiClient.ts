import {
  getQuote as getLifiQuote,
  getRoutes as getLifiRoutes,
  getStatus as getLifiStatus,
  getStepTransaction,
  getTokens as getLifiTokens
} from "@lifi/sdk";
import type { Route as SdkRoute } from "@lifi/types";
import { getAddress } from "viem";
import type { Address } from "viem";

import { ensureLifiSdkConfigured } from "./config.js";
import { LifiApiError } from "./errors.js";
import type {
  LifiClient,
  LifiToken,
  PluginConfig,
  RoutePlan,
  RouteQuote,
  RouteStep,
} from "./types.js";

export type { LifiClient } from "./types.js";

export class LifiSdkClient implements LifiClient {
  constructor(private readonly config: PluginConfig) {
    ensureLifiSdkConfigured(config);
  }

  async getTokens(chainId: number): Promise<LifiToken[]> {
    try {
      const response = await getLifiTokens({ chains: [chainId] });
      return (response.tokens[chainId] ?? []) as LifiToken[];
    } catch (error) {
      throw toLifiApiError(error);
    }
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
    try {
      const quote = await getLifiQuote({
        fromChain: params.fromChain,
        toChain: params.toChain,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        fromAmount: params.fromAmount.toString(),
      });

      return {
        tool: quote.tool,
        toAmount: quote.estimate?.toAmount ?? quote.action.fromAmount,
        toAmountMin: quote.estimate?.toAmountMin,
        approvalAddress: quote.estimate?.approvalAddress
          ? getAddress(quote.estimate.approvalAddress)
          : undefined,
        gasCosts: quote.estimate?.gasCosts?.map((cost) => ({
          amount: cost.amount,
          token: { symbol: cost.token.symbol },
        })),
      };
    } catch (error) {
      throw toLifiApiError(error);
    }
  }

  async getRoutes(params: {
    fromChain: number;
    toChain: number;
    fromToken: Address;
    toToken: Address;
    fromAddress: Address;
    fromAmount: bigint;
    toAddress?: Address;
  }): Promise<RoutePlan[]> {
    try {
      const response = await getLifiRoutes({
        fromChainId: params.fromChain,
        toChainId: params.toChain,
        fromTokenAddress: params.fromToken,
        toTokenAddress: params.toToken,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        fromAmount: params.fromAmount.toString(),
        options: {
          integrator: this.config.integrator,
          allowSwitchChain: true
        },
      });

      if (!response.routes?.length) {
        throw new LifiApiError("LI.FI did not return any routes.");
      }

      return response.routes.map(toRoutePlan);
    } catch (error) {
      throw toLifiApiError(error);
    }
  }

  async populateStepTransaction(step: RouteStep): Promise<RouteStep> {
    try {
      return (await getStepTransaction(step as never)) as RouteStep;
    } catch (error) {
      throw toLifiApiError(error);
    }
  }

  async getStatus(params: Record<string, string>): Promise<unknown> {
    try {
      return await getLifiStatus(params as never);
    } catch (error) {
      throw toLifiApiError(error);
    }
  }
}

function toLifiApiError(error: unknown): LifiApiError {
  if (error instanceof LifiApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new LifiApiError(error.message);
  }

  return new LifiApiError("Unknown LI.FI SDK error");
}

function toRoutePlan(route: SdkRoute): RoutePlan {
  return {
    id: route.id,
    fromChainId: route.fromChainId,
    toChainId: route.toChainId,
    fromTokenAddress: getAddress(route.fromToken.address),
    toTokenAddress: getAddress(route.toToken.address),
    fromAmount: route.fromAmount,
    toAmount: route.toAmount,
    steps: route.steps as unknown as RouteStep[],
    sdkRoute: route,
  };
}
