import { arbitrum, avalanche, base, codex, celo, mainnet, hyperEvm, ink, linea, monad, morph, near, optimism, plume, polygon, sei, sonic, unichain, worldchain, xdc, zksync, berachain, katana, gnosis, scroll, megaeth, bsc } from "viem/chains";
export const COINS = ["USDC", "USDT", "DAI"];
export const BPS_DENOMINATOR = 10000n;
export const DEFAULT_CONFIG = {
    lifiBaseUrl: "https://li.quest/v1",
    integrator: "intent-completion",
};
export const LIFI_CHAIN_NAME_TO_VIEM_CHAIN = {
    eth: mainnet,
    arb: arbitrum,
    ava: avalanche,
    bas: base,
    ber: berachain,
    bsc: bsc,
    cel: celo,
    codex: codex,
    dai: gnosis,
    ink: ink,
    kat: katana,
    lna: linea,
    hyp: hyperEvm,
    plu: plume,
    meg: megaeth,
    mon: monad,
    mop: morph,
    near: near,
    opt: optimism,
    pol: polygon,
    scl: scroll,
    sei: sei,
    son: sonic,
    uni: unichain,
    wcc: worldchain,
    xdc: xdc,
    zksync: zksync,
};
//# sourceMappingURL=constants.js.map