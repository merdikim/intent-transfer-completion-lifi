import { formatUnits, zeroAddress } from "viem";
import type { Address } from "viem";
import { getAssetBalance } from "./balances.js";
import { InsufficientFundsError } from "./errors.js";
import type {
  AssetRef,
  BalancePosition,
  PluginConfig,
  ResolvedIntent,
  RouteCandidate,
  TransferPlan,
  LifiClient
} from "./types.js";
import { loadConfig } from "./config.js";
import { HttpLifiClient } from "./lifiClient.js";

export async function planTransfer(
  intent: ResolvedIntent,
  ownerAddress: Address,
  balances: BalancePosition[],
  assetBalance: bigint
): Promise<TransferPlan> {
  const shortfallRaw = intent.amountRaw > assetBalance ? intent.amountRaw - assetBalance : 0n;
  const targetNativeSymbol = intent.chain.nativeSymbol!;
  const targetNativeAsset: AssetRef = {
    symbol: targetNativeSymbol,
    address: zeroAddress,
    decimals: 18,
    chainId: intent.chain.id,
    chainKey: intent.chain.key,
    // isNative: true
  };
  const targetNativeBalance = await getAssetBalance(ownerAddress, targetNativeAsset);

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

  const lifiClient = new HttpLifiClient(loadConfig());

  const candidate = await selectBestRouteCandidate(intent, ownerAddress, balances, shortfallRaw, lifiClient);
  const route = await lifiClient.getRoutes({
    fromChain: candidate.sourceBalance.chainId,
    toChain: intent.chain.id,
    fromToken: candidate.sourceBalance.token.address,
    toToken: intent.asset.address,
    fromAddress: ownerAddress,
    toAddress: ownerAddress,
    fromAmount: candidate.sourceBalance.rawAmount,
  });

  return {
    ownerAddress,
    recipient: intent.recipient,
    targetChain: intent.chain,
    targetAsset: intent.asset,
    requestedAmountRaw: intent.amountRaw,
    currentTargetBalanceRaw: assetBalance,
    shortfallRaw,
    route,
  };
}

async function selectBestRouteCandidate(
  intent: ResolvedIntent,
  ownerAddress: Address,
  balances: BalancePosition[],
  shortfallRaw: bigint,
  lifiClient: LifiClient,
): Promise<RouteCandidate> {
  const candidates = balances.filter((position) => position.rawAmount > 0n);
  if (candidates.length === 0) {
    throw new InsufficientFundsError("No spendable balances were found across configured chains.");
  }

  let bestCandidate: RouteCandidate | undefined;
  let bestAmount = 0n;

  for (const position of candidates) {
    const fromAmount = position.rawAmount > shortfallRaw ? shortfallRaw : position.rawAmount;
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
      return { sourceBalance: position, quote };
    }
  }

  if (!bestCandidate) {
    throw new InsufficientFundsError("Unable to obtain any viable LI.FI quote.");
  }

  throw new InsufficientFundsError(
    `Portfolio value is insufficient. Best route would yield ${formatUnits(bestAmount, intent.asset.decimals)} ${
      intent.asset.symbol
    }, but ${formatUnits(shortfallRaw, intent.asset.decimals)} ${intent.asset.symbol} is required on ${
      intent.chain.name
    }.`
  );
}
