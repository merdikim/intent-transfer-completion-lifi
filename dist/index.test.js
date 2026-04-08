import test from "node:test";
import assert from "node:assert/strict";
import { formatUnits } from "viem";
import { loadConfig } from "./config.js";
import { parseIntent } from "./parseIntent.js";
import { planTransfer } from "./routePlanner.js";
test("parseIntent parses compact token symbol input", () => {
    const parsed = parseIntent("send 50usdc to merkim.eth on base");
    assert.equal(parsed.action, "send");
    assert.equal(parsed.amount, "50");
    assert.equal(parsed.tokenSymbol, "USDC");
    assert.equal(parsed.recipient, "merkim.eth");
    assert.equal(parsed.requestedChain, "base");
});
test("planTransfer skips LI.FI route when destination balance is sufficient", async () => {
    const resolvedIntent = {
        parsed: {
            rawIntent: "send 50usdc to merkim.eth on base",
            action: "send",
            amount: "50",
            tokenSymbol: "USDC",
            recipient: "merkim.eth",
            requestedChain: "base"
        },
        recipient: {
            raw: "merkim.eth",
            resolvedAddress: "0x1111111111111111111111111111111111111111",
            ensName: "merkim.eth"
        },
        chain: {
            key: "base",
            id: 8453,
            name: "Base",
            chain: {},
            nativeSymbol: "ETH",
            aliases: ["base"]
        },
        asset: {
            symbol: "USDC",
            address: "0x833589fCD6EDB6E08f4c7C32D4f71b54bdA02913",
            decimals: 6,
            chainId: 8453,
            chainKey: "base",
            isNative: false
        },
        amountRaw: 50000000n
    };
    const balances = [
        {
            chainId: 8453,
            chainKey: "base",
            token: {
                symbol: "USDC",
                address: "0x833589fCD6EDB6E08f4c7C32D4f71b54bdA02913",
                decimals: 6,
                chainId: 8453,
                chainKey: "base",
                isNative: false
            },
            rawAmount: 75000000n,
            formattedAmount: "75"
        }
    ];
    const config = {
        ...loadConfig({
            rpcUrls: { base: "http://127.0.0.1:8545" }
        }),
        rpcUrls: { base: "http://127.0.0.1:8545" }
    };
    const lifiClient = {
        async getTokens() {
            return [];
        },
        async getQuote() {
            throw new Error("quote should not be called");
        },
        async getRoutes() {
            throw new Error("routes should not be called");
        },
        async getStatus() {
            return {};
        }
    };
    const plan = await planTransfer(resolvedIntent, "0x2222222222222222222222222222222222222222", balances, lifiClient, config, async (_owner, asset) => (asset.symbol === "USDC" ? 75000000n : 1000000000000000n));
    assert.equal(plan.shortfallRaw, 0n);
    assert.equal(plan.route, undefined);
});
test("parseIntent preserves decimals", () => {
    const parsed = parseIntent("send 0.1 eth to vitalik.eth on arbitrum");
    assert.equal(parsed.amount, "0.1");
    assert.equal(parsed.tokenSymbol, "ETH");
    assert.equal(formatUnits(100000000000000000n, 18), "0.1");
});
test("planTransfer selects a LI.FI route when the destination chain is short", async () => {
    const resolvedIntent = {
        parsed: {
            rawIntent: "transfer 250 dai to 0xabc123 on optimism",
            action: "transfer",
            amount: "250",
            tokenSymbol: "DAI",
            recipient: "0xabc123",
            requestedChain: "optimism"
        },
        recipient: {
            raw: "0x3333333333333333333333333333333333333333",
            resolvedAddress: "0x3333333333333333333333333333333333333333"
        },
        chain: {
            key: "optimism",
            id: 10,
            name: "Optimism",
            chain: {},
            nativeSymbol: "ETH",
            aliases: ["optimism"]
        },
        asset: {
            symbol: "DAI",
            address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
            decimals: 18,
            chainId: 10,
            chainKey: "optimism",
            isNative: false
        },
        amountRaw: 250000000000000000000n
    };
    const balances = [
        {
            chainId: 42161,
            chainKey: "arbitrum",
            token: {
                symbol: "USDC",
                address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
                decimals: 6,
                chainId: 42161,
                chainKey: "arbitrum",
                isNative: false
            },
            rawAmount: 400000000n,
            formattedAmount: "400"
        }
    ];
    const config = {
        ...loadConfig({
            rpcUrls: { optimism: "http://127.0.0.1:8545", arbitrum: "http://127.0.0.1:8546" }
        }),
        rpcUrls: { optimism: "http://127.0.0.1:8545", arbitrum: "http://127.0.0.1:8546" }
    };
    const lifiClient = {
        async getTokens() {
            return [];
        },
        async getQuote() {
            return {
                toAmount: "260000000000000000000"
            };
        },
        async getRoutes() {
            return {
                fromChainId: 42161,
                toChainId: 10,
                fromTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
                toTokenAddress: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
                fromAmount: "400000000",
                toAmount: "260000000000000000000",
                steps: []
            };
        },
        async getStatus() {
            return {};
        }
    };
    const plan = await planTransfer(resolvedIntent, "0x4444444444444444444444444444444444444444", balances, lifiClient, config, async (_owner, asset) => (asset.symbol === "DAI" ? 0n : 1000000000000000n));
    assert.equal(plan.shortfallRaw, 250000000000000000000n);
    assert.ok(plan.route);
    assert.equal(plan.route?.fromChainId, 42161);
});
//# sourceMappingURL=index.test.js.map