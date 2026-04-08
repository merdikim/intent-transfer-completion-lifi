import { LifiApiError } from "./errors.js";
export class HttpLifiClient {
    config;
    constructor(config) {
        this.config = config;
    }
    async getTokens(chainId) {
        const response = await this.request("/tokens", {
            query: { chains: chainId }
        });
        return Object.values(response.tokens ?? {});
    }
    async getQuote(params) {
        return this.request("/quote", {
            query: {
                fromChain: params.fromChain,
                toChain: params.toChain,
                fromToken: params.fromToken,
                toToken: params.toToken,
                fromAddress: params.fromAddress,
                toAddress: params.toAddress,
                fromAmount: params.fromAmount.toString(),
                slippage: ((params.slippageBps ?? this.config.defaultSlippageBps) / 100).toString()
            }
        });
    }
    async getRoutes(params) {
        const response = await this.request("/advanced/routes", {
            method: "POST",
            body: {
                fromChainId: params.fromChain,
                toChainId: params.toChain,
                fromTokenAddress: params.fromToken,
                toTokenAddress: params.toToken,
                fromAddress: params.fromAddress,
                toAddress: params.toAddress,
                fromAmount: params.fromAmount.toString(),
                options: {
                    slippage: (params.slippageBps ?? this.config.defaultSlippageBps) / 100,
                    integrator: this.config.integrator,
                    allowSwitchChain: true,
                    maxPriceImpact: 0.2
                }
            }
        });
        const route = response.routes?.[0];
        if (!route) {
            throw new LifiApiError("LI.FI did not return a route.");
        }
        return route;
    }
    async getStatus(params) {
        return this.request("/status", { query: params });
    }
    async request(path, options) {
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
        const response = await fetch(url, {
            method: options.method ?? "GET",
            headers: {
                "content-type": "application/json",
                "x-lifi-api-key": this.config.lifiApiKey ?? ""
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        if (!response.ok) {
            throw new LifiApiError(`LI.FI request failed with status ${response.status}`);
        }
        return (await response.json());
    }
}
//# sourceMappingURL=lifiClient.js.map