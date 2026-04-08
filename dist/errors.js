export class IntentParseError extends Error {
    constructor(message) {
        super(message);
        this.name = "IntentParseError";
    }
}
export class UnsupportedChainError extends Error {
    constructor(chain) {
        super(`Unsupported destination chain: ${chain}`);
        this.name = "UnsupportedChainError";
    }
}
export class UnsupportedTokenError extends Error {
    constructor(token, chain) {
        super(`Unsupported token ${token} on ${chain}`);
        this.name = "UnsupportedTokenError";
    }
}
export class RecipientResolutionError extends Error {
    constructor(recipient) {
        super(`Could not resolve recipient: ${recipient}`);
        this.name = "RecipientResolutionError";
    }
}
export class InsufficientFundsError extends Error {
    constructor(message) {
        super(message);
        this.name = "InsufficientFundsError";
    }
}
export class MissingSignerError extends Error {
    constructor() {
        super("Live execution requires OPENCLAW_PRIVATE_KEY or an equivalent configured signer.");
        this.name = "MissingSignerError";
    }
}
export class LifiApiError extends Error {
    constructor(message) {
        super(message);
        this.name = "LifiApiError";
    }
}
export class ExecutionError extends Error {
    constructor(message) {
        super(message);
        this.name = "ExecutionError";
    }
}
//# sourceMappingURL=errors.js.map