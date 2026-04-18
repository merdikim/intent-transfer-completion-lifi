import test from "node:test";
import assert from "node:assert/strict";
import { formatUnits } from "viem";
import { LifiSdkClient } from "./lifiClient.js";
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
test("parseIntent preserves decimals", () => {
    const parsed = parseIntent("send 0.1 eth to vitalik.eth on arbitrum");
    assert.equal(parsed.amount, "0.1");
    assert.equal(parsed.tokenSymbol, "ETH");
    assert.equal(formatUnits(100000000000000000n, 18), "0.1");
});
test("planTransfer selects a LI.FI route when the destination chain is short", async (t) => {
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
            chainKey: "optimism"
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
                chainKey: "arbitrum"
            },
            rawAmount: 400000000n,
            formattedAmount: "400"
        }
    ];
    t.mock.method(LifiSdkClient.prototype, "getRoutes", async () => [
        {
            fromChainId: 42161,
            toChainId: 10,
            fromTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            toTokenAddress: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
            fromAmount: "400000000",
            toAmount: "260000000000000000000",
            steps: [],
            sdkRoute: {
                id: "route-1",
                insurance: { state: "NOT_INSURABLE", feeAmountUsd: "0" },
                fromChainId: 42161,
                fromAmountUSD: "400",
                fromAmount: "400000000",
                fromToken: {
                    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
                    chainId: 42161,
                    symbol: "USDC",
                    decimals: 6,
                    name: "USD Coin",
                    coinKey: "USDC",
                    logoURI: "",
                    priceUSD: "1"
                },
                fromAddress: "0x4444444444444444444444444444444444444444",
                toChainId: 10,
                toAmountUSD: "260",
                toAmount: "260000000000000000000",
                toAmountMin: "250000000000000000000",
                toToken: {
                    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
                    chainId: 10,
                    symbol: "DAI",
                    decimals: 18,
                    name: "DAI Stablecoin",
                    coinKey: "DAI",
                    logoURI: "",
                    priceUSD: "1"
                },
                toAddress: "0x4444444444444444444444444444444444444444",
                steps: []
            }
        }
    ]);
    const plan = await planTransfer(resolvedIntent, "0x4444444444444444444444444444444444444444", balances, 0n);
    assert.equal(plan.shortfallRaw, 250000000000000000000n);
    assert.ok(plan.route);
    assert.equal(plan.route?.fromChainId, 42161);
});
//# sourceMappingURL=index.test.js.map