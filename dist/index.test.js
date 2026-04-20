import test from "node:test";
import assert from "node:assert/strict";
import plugin, { completeTransferIntent, register } from "./index.js";
test("plugin exposes the transfer tool with the expected execute handler", () => {
    assert.equal(plugin.id, "intent-transfer-completion-lifi");
    assert.equal(plugin.name, "Intent Transfer Completion via LI.FI");
    assert.equal(plugin.tools.length, 1);
    const [tool] = plugin.tools;
    const inputSchema = tool.inputSchema;
    assert.ok(tool);
    assert.equal(tool.name, "complete_transfer_intent");
    assert.equal(tool.execute, completeTransferIntent);
    assert.deepEqual(inputSchema.required, ["intent"]);
    assert.equal(inputSchema.properties.intent.type, "string");
    assert.equal(inputSchema.properties.walletPath.type, "string");
});
test("default export and named plugin export are the same object", async () => {
    const module = await import("./index.js");
    assert.equal(module.default, module.plugin);
});
test("plugin exposes a register lifecycle hook", () => {
    assert.equal(plugin.register, register);
    assert.equal(typeof register, "function");
});
//# sourceMappingURL=index.test.js.map