import { formatUnits, zeroAddress } from "viem";
import { getAssetBalance } from "./balances.js";
import { loadConfig } from "./config.js";
import { InsufficientFundsError } from "./errors.js";
import { HttpLifiClient } from "./lifiClient.js";
export async function planTransfer(intent, ownerAddress, balances, assetBalanceOrLifiClient, config = loadConfig(), assetBalanceGetter = getAssetBalance) {
    const lifiClient = typeof assetBalanceOrLifiClient === "bigint" ? new HttpLifiClient(config) : assetBalanceOrLifiClient;
    const assetBalance = typeof assetBalanceOrLifiClient === "bigint"
        ? assetBalanceOrLifiClient
        : await assetBalanceGetter(ownerAddress, intent.asset);
    const shortfallRaw = intent.amountRaw > assetBalance ? intent.amountRaw - assetBalance : 0n;
    if (shortfallRaw === 0n) {
        return {
            ownerAddress,
            recipient: intent.recipient,
            targetChain: intent.chain,
            targetAsset: intent.asset,
            requestedAmountRaw: intent.amountRaw,
            currentTargetBalanceRaw: assetBalance,
            shortfallRaw
        };
    }
    await ensureTargetNativeBalance(intent, ownerAddress, assetBalanceGetter);
    const candidate = await selectBestRouteCandidate(intent, ownerAddress, balances, shortfallRaw, lifiClient);
    return {
        ownerAddress,
        recipient: intent.recipient,
        targetChain: intent.chain,
        targetAsset: intent.asset,
        requestedAmountRaw: intent.amountRaw,
        currentTargetBalanceRaw: assetBalance,
        shortfallRaw,
        route: candidate.route
    };
}
async function ensureTargetNativeBalance(intent, ownerAddress, assetBalanceGetter) {
    const nativeSymbol = intent.chain.nativeSymbol;
    if (!nativeSymbol) {
        return;
    }
    const targetNativeAsset = {
        symbol: nativeSymbol,
        address: zeroAddress,
        decimals: 18,
        chainId: intent.chain.id,
        chainKey: intent.chain.key,
        isNative: true
    };
    await assetBalanceGetter(ownerAddress, targetNativeAsset);
}
async function selectBestRouteCandidate(intent, ownerAddress, balances, shortfallRaw, lifiClient) {
    const candidates = balances.filter((position) => position.rawAmount > 0n);
    if (candidates.length === 0) {
        throw new InsufficientFundsError("No spendable balances were found across configured chains.");
    }
    let bestCandidate;
    let bestAmount = 0n;
    for (const position of candidates) {
        const fromAmount = position.rawAmount;
        const quote = await lifiClient.getQuote({
            fromChain: position.chainId,
            toChain: intent.chain.id,
            fromToken: position.token.address,
            toToken: intent.asset.address,
            fromAddress: ownerAddress,
            toAddress: ownerAddress,
            fromAmount
        });
        const toAmount = BigInt(quote.toAmount);
        if (toAmount > bestAmount) {
            bestAmount = toAmount;
            bestCandidate = { sourceBalance: position, quote };
        }
        if (toAmount >= shortfallRaw) {
            return {
                sourceBalance: position,
                quote,
                route: await lifiClient.getRoutes({
                    fromChain: position.chainId,
                    toChain: intent.chain.id,
                    fromToken: position.token.address,
                    toToken: intent.asset.address,
                    fromAddress: ownerAddress,
                    toAddress: ownerAddress,
                    fromAmount
                })
            };
        }
    }
    if (!bestCandidate) {
        throw new InsufficientFundsError("Unable to obtain any viable LI.FI quote.");
    }
    throw new InsufficientFundsError(`Portfolio value is insufficient. Best route would yield ${formatUnits(bestAmount, intent.asset.decimals)} ${intent.asset.symbol}, but ${formatUnits(shortfallRaw, intent.asset.decimals)} ${intent.asset.symbol} is required on ${intent.chain.name}.`);
}
//# sourceMappingURL=routePlanner.js.map