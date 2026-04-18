import { formatUnits } from "viem";
import { InsufficientFundsError } from "./errors.js";
import { loadConfig } from "./config.js";
import { LifiSdkClient } from "./lifiClient.js";
const BPS_DENOMINATOR = 10000n;
export async function planTransfer(intent, ownerAddress, balances, assetBalance) {
    const shortfallRaw = intent.amountRaw - assetBalance; //intent.amountRaw > assetBalance ? intent.amountRaw - assetBalance : 0n;
    const candidate = await selectBestRouteCandidate(intent, ownerAddress, balances, shortfallRaw);
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
async function selectBestRouteCandidate(intent, ownerAddress, balances, shortfallRaw) {
    const nonTargetBalances = balances.filter((balance) => balance.token.chainId !== intent.asset.chainId ||
        balance.token.address.toLowerCase() !== intent.asset.address.toLowerCase());
    const config = loadConfig();
    const lifiClient = new LifiSdkClient(config);
    if (balances.length === 0) {
        throw new InsufficientFundsError("No spendable balances were found across configured chains.");
    }
    if (nonTargetBalances.length === 0) {
        throw new InsufficientFundsError(`Not enough funds available. Only ${intent.asset.symbol} was found, but the available balance does not cover the requested amount.`);
    }
    let bestCandidate;
    let bestAmount = 0n;
    //slight buffer to increase chances of route `toAmount` meeting or exceeding `shortfallRaw` after accounting for potential slippage and fees, without being so large as to cause excessive unnecessary transfers
    const bufferedShortfallRaw = applyBufferBps(shortfallRaw, BigInt(config.routeFromAmountBufferBps));
    for (const balance of nonTargetBalances) {
        const fromAmount = balance.rawAmount > bufferedShortfallRaw ? bufferedShortfallRaw : balance.rawAmount;
        const routes = await lifiClient.getRoutes({
            fromChain: balance.chainId,
            toChain: intent.chain.id,
            fromToken: balance.token.address,
            toToken: intent.asset.address,
            fromAddress: ownerAddress,
            toAddress: ownerAddress,
            fromAmount
        });
        const route = routes[0];
        const toAmount = BigInt(route.toAmount);
        if (toAmount > bestAmount) {
            bestAmount = toAmount;
            bestCandidate = { sourceBalance: balance, route };
        }
        if (toAmount >= shortfallRaw) {
            return { sourceBalance: balance, route };
        }
    }
    if (!bestCandidate) {
        throw new InsufficientFundsError("Unable to obtain any viable LI.FI routes.");
    }
    throw new InsufficientFundsError(`Portfolio value is insufficient. Best route would yield ${formatUnits(bestAmount, intent.asset.decimals)} ${intent.asset.symbol}, but ${formatUnits(shortfallRaw, intent.asset.decimals)} ${intent.asset.symbol} is required on ${intent.chain.name}.`);
}
function applyBufferBps(amount, bufferBps) {
    if (amount <= 0n || bufferBps <= 0n) {
        return amount;
    }
    return (amount * (BPS_DENOMINATOR + bufferBps) + (BPS_DENOMINATOR - 1n)) / BPS_DENOMINATOR;
}
//# sourceMappingURL=routePlanner.js.map