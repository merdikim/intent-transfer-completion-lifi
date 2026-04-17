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
                fromAmount: params.fromAmount.toString()
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
                // options: {
                //   integrator: this.config.integrator,
                //   allowSwitchChain: true,
                //   maxPriceImpact: 0.2
                // }
            }
        });
        if (!response.routes || response.routes.length === 0) {
            throw new LifiApiError("LI.FI did not return any routes.");
        }
        return response.routes;
    }
    async populateStepTransaction(step) {
        return this.request("/advanced/stepTransaction", {
            method: "POST",
            body: {
                ...step,
                action: {
                    ...step.action,
                    fromAddress: step.action.fromAddress,
                    toAddress: step.action.toAddress,
                },
            }
        });
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
        const headers = {};
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
            throw new LifiApiError(`LI.FI request failed with status ${response.status}${errorText ? `: ${errorText}` : ""}`);
        }
        return (await response.json());
    }
}
//# sourceMappingURL=lifiClient.js.map