import { parseUnits } from "viem";
import { getChainByAlias } from "./config.js";
import { UnsupportedChainError } from "./errors.js";
export async function resolveIntent(parsed, config, lifiClient) {
    const chain = getChainByAlias(parsed.requestedChain);
    if (!chain) {
        throw new UnsupportedChainError(parsed.requestedChain);
    }
    const asset = await resolveAsset(parsed.tokenSymbol, chain.key, lifiClient);
    const recipient = await resolveRecipient(parsed.recipient, config);
    const amountRaw = parseUnits(parsed.amount, asset.decimals);
    return { parsed, recipient, chain, asset, amountRaw };
}
// export async function resolveRecipient(recipient: string, config: PluginConfig): Promise<ResolvedRecipient> {
//   if (isAddress(recipient)) {
//     return { raw: recipient, resolvedAddress: getAddress(recipient) };
//   }
//   if (!recipient.toLowerCase().endsWith(".eth")) {
//     throw new RecipientResolutionError(recipient);
//   }
//   const client = createPublicClient({
//     chain: SUPPORTED_CHAINS.ethereum.chain,
//     transport: http()
//   });
//   const resolvedAddress = await client.getEnsAddress({ name: recipient });
//   if (!resolvedAddress) {
//     throw new RecipientResolutionError(recipient);
//   }
//   return { raw: recipient, resolvedAddress, ensName: recipient };
// }
// export async function resolveAsset(
//   tokenSymbol: string,
//   chainKey: keyof typeof SUPPORTED_CHAINS,
//   lifiClient: LifiClient
// ): Promise<AssetRef> {
//   const registryEntry = DEFAULT_TOKEN_REGISTRY[tokenSymbol.toUpperCase()];
//   if (registryEntry) {
//     const address = registryEntry.addresses[chainKey];
//     const isNative = registryEntry.nativeOn?.includes(chainKey) ?? false;
//     if (address) {
//       return {
//         symbol: registryEntry.symbol,
//         address,
//         decimals: registryEntry.decimals,
//         chainId: SUPPORTED_CHAINS[chainKey].id,
//         chainKey,
//         isNative: isNative || address === NATIVE_TOKEN_ADDRESS
//       };
//     }
//   }
//   const chainId = SUPPORTED_CHAINS[chainKey].id;
//   const lifiToken = (await lifiClient.getTokens(chainId)).find(
//     (token) => token.symbol.toUpperCase() === tokenSymbol.toUpperCase()
//   );
//   if (!lifiToken) {
//     throw new UnsupportedTokenError(tokenSymbol, SUPPORTED_CHAINS[chainKey].name);
//   }
//   return {
//     symbol: lifiToken.symbol.toUpperCase(),
//     address: lifiToken.address,
//     decimals: lifiToken.decimals,
//     chainId,
//     chainKey,
//     isNative: lifiToken.address === NATIVE_TOKEN_ADDRESS
//   };
// }
//# sourceMappingURL=resolveAssets.js.map