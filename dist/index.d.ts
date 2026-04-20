import type { ExecutionResult, OpenClawPlugin, ToolInput } from "./types.js";
type OpenClawToolResult = {
    content: Array<{
        type: "text";
        text: string;
    }>;
    details?: unknown;
};
type OpenClawPluginApi = {
    registerTool: (tool: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
        execute: (_toolCallId: string, params: Record<string, unknown>) => Promise<OpenClawToolResult>;
    }) => void;
};
export declare function completeTransferIntent(input: ToolInput): Promise<ExecutionResult>;
export declare function register(api: OpenClawPluginApi): void;
export declare const plugin: OpenClawPlugin;
export default plugin;
