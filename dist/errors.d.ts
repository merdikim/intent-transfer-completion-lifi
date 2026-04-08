export declare class IntentParseError extends Error {
    constructor(message: string);
}
export declare class UnsupportedChainError extends Error {
    constructor(chain: string);
}
export declare class UnsupportedTokenError extends Error {
    constructor(token: string, chain: string);
}
export declare class RecipientResolutionError extends Error {
    constructor(recipient: string);
}
export declare class InsufficientFundsError extends Error {
    constructor(message: string);
}
export declare class MissingSignerError extends Error {
    constructor();
}
export declare class LifiApiError extends Error {
    constructor(message: string);
}
export declare class ExecutionError extends Error {
    constructor(message: string);
}
