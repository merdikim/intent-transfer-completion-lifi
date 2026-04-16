import {
  Address,
  createPublicClient,
  getAddress,
  http,
  isAddress,
  parseUnits
} from "viem";

import { getChainByAlias, getSupportedTokens } from "./config.js";
import { RecipientResolutionError, UnsupportedChainError, UnsupportedTokenError } from "./errors.js";
import type { AssetRef, ParsedIntent, ResolvedIntent, ResolvedRecipient, SupportedToken } from "./types.js";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

export async function resolveIntent(
  parsed: ParsedIntent
): Promise<ResolvedIntent> {
  const chain = await getChainByAlias(parsed.requestedChain);
  if (!chain) {
    throw new UnsupportedChainError(parsed.requestedChain);
  }

  const asset = await resolveAsset(parsed.tokenSymbol, chain.id);
  const recipient = await resolveRecipient(parsed.recipient);
  const amountRaw = parseUnits(parsed.amount, asset.decimals);

  return { parsed, recipient, chain, asset, amountRaw } as ResolvedIntent;
}

export async function resolveRecipient(recipient: string): Promise<ResolvedRecipient> {
  if (isAddress(recipient)) {
    return { raw: recipient, resolvedAddress: getAddress(recipient) };
  }

  if (!recipient.toLowerCase().endsWith(".eth")) {
    throw new RecipientResolutionError(recipient);
  }

  const client = createPublicClient({
    chain: mainnet,
    transport: http("https://ethereum-rpc.publicnode.com")
  });

  const resolvedAddress = await client.getEnsAddress({ name: normalize(recipient) });
  
  if (!resolvedAddress) {
    throw new RecipientResolutionError(recipient);
  }

  return { raw: recipient, resolvedAddress, ensName: recipient };
}

export async function resolveAsset(
  tokenSymbol: string,
  chainKey:number
): Promise<AssetRef> {
  const normalizedSymbol = tokenSymbol.toUpperCase();
  const token = await getSupportedTokens(chainKey).then((tokens:Array<SupportedToken>) => tokens.find(t => t.symbol.toUpperCase() === normalizedSymbol));

  if (!token) {
    throw new UnsupportedTokenError(tokenSymbol, chainKey);
  }

  return {
    symbol: token.symbol.toUpperCase(),
    address: token.address,
    decimals: token.decimals,
    chainId: token.chainId,
    //isNative: token.address === NATIVE_TOKEN_ADDRESS
  };
}
