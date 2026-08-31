import { detectWsl } from "./lib/wsl-host.js";
import * as core from "./lib/shot.js";

export const name = "dsh-wsl-shot";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const timeoutMs = positive(config.timeoutMs, 15_000);
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:win_shot",
    order: 119,
    text: "Use win_shot for WSL/Windows interop: Save a Windows clipboard image into a WSL file for multimodal chat.",
  });

  ctx.tools.register({
    name: "win_shot",
    description: "Save a Windows clipboard image into a WSL file for multimodal chat.",
    parameters: core.parameters(config),
    output: {
      schema: core.outputSchema(),
      render: (_args, value) => [{ type: "text", text: core.format(value) }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      if (!wsl) return core.notWsl ? core.notWsl() : { ok: false, error: "not running in WSL" };
      return core.execute(args, config);
    },
    presentCall: () => ({ card: "generic", title: "win_shot" }),
    presentResult: (_args, result) => (
      result.isError
        ? { card: "generic", title: "win_shot failed", content: result.content }
        : { card: "generic", title: "win_shot", content: result.content }
    ),
  });
}

function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
