import { getQuote as getLifiQuote, getRoutes as getLifiRoutes, getStatus as getLifiStatus, getStepTransaction, getTokens as getLifiTokens } from "@lifi/sdk";
import { getAddress } from "viem";
import { ensureLifiSdkConfigured } from "./config.js";
import { LifiApiError } from "./errors.js";
export class LifiSdkClient {
    config;
    constructor(config) {
        this.config = config;
        ensureLifiSdkConfigured(config);
    }
    async getTokens(chainId) {
        try {
            const response = await getLifiTokens({ chains: [chainId] });
            return (response.tokens[chainId] ?? []);
        }
        catch (error) {
            throw toLifiApiError(error);
        }
    }
    async getQuote(params) {
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
        }
        catch (error) {
            throw toLifiApiError(error);
        }
    }
    async getRoutes(params) {
        try {
            const response = await getLifiRoutes({
                fromChainId: params.fromChain,
                toChainId: params.toChain,
                fromTokenAddress: params.fromToken,
                toTokenAddress: params.toToken,
                fromAddress: params.fromAddress,
                toAddress: params.toAddress,
                fromAmount: '10000000000', //params.fromAmount.toString(),
                options: {
                    integrator: this.config.integrator,
                    allowSwitchChain: true,
                    slippage: this.config.defaultSlippageBps / 10_000,
                },
            });
            if (!response.routes?.length) {
                throw new LifiApiError("LI.FI did not return any routes.");
            }
            return response.routes.map(toRoutePlan);
        }
        catch (error) {
            throw toLifiApiError(error);
        }
    }
    async populateStepTransaction(step) {
        try {
            return (await getStepTransaction(step));
        }
        catch (error) {
            throw toLifiApiError(error);
        }
    }
    async getStatus(params) {
        try {
            return await getLifiStatus(params);
        }
        catch (error) {
            throw toLifiApiError(error);
        }
    }
}
function toLifiApiError(error) {
    if (error instanceof LifiApiError) {
        return error;
    }
    if (error instanceof Error) {
        return new LifiApiError(error.message);
    }
    return new LifiApiError("Unknown LI.FI SDK error");
}
function toRoutePlan(route) {
    return {
        id: route.id,
        fromChainId: route.fromChainId,
        toChainId: route.toChainId,
        fromTokenAddress: getAddress(route.fromToken.address),
        toTokenAddress: getAddress(route.toToken.address),
        fromAmount: route.fromAmount,
        toAmount: route.toAmount,
        steps: route.steps,
        sdkRoute: route,
    };
}
//# sourceMappingURL=lifiClient.js.map