import { detectWsl, runPowerShell } from "./lib/wsl-host.js";
import {
  ensureShotDir,
  fileSize,
  formatShotResult,
  isJailed,
  jailRoots,
  resolveShotPath,
  saveClipboardPngScript,
  toWindowsPath,
} from "./lib/shot.js";

export const name = "dsh-wsl-shot";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const timeoutMs = positive(config.timeoutMs, 15_000);
  const dir = typeof config.dir === "string" && config.dir.trim()
    ? config.dir.trim()
    : "/tmp/dsh-wsl-shot";
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:win_shot",
    order: 127,
    text: [
      "Use win_shot when the user has an image on the Windows clipboard and you need a Linux PNG path for multimodal input.",
      "Writes only under /tmp and the home directory jail. If the clipboard has no image, report a clear error.",
    ].join(" "),
  });

  ctx.tools.register({
    name: "win_shot",
    description:
      "Save the Windows clipboard image as a PNG under a jailed WSL directory; return Linux path and size.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        filename: {
          type: "string",
          description: "Optional safe filename (png). Default clip-<timestamp>.png.",
        },
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          ok: { type: "boolean" },
          path: { type: "string" },
          bytes: { type: "integer" },
          error: { type: "string" },
        },
      },
      render: (_args, value) => [{ type: "text", text: formatShotResult(value) }],
    },
    timeoutMs,
    isConcurrencySafe: () => false,
    async execute(args) {
      if (!wsl) {
        return { ok: false, error: "not running in WSL" };
      }
      const roots = jailRoots();
      if (!isJailed(dir, roots)) {
        return { ok: false, error: `dir not jailed under /tmp or home: ${dir}` };
      }
      const { file, dir: shotDir } = resolveShotPath(dir, args?.filename);
      if (!isJailed(file, roots)) {
        return { ok: false, error: "resolved path escapes jail" };
      }
      try {
        ensureShotDir(shotDir);
        const winPath = await toWindowsPath(file);
        if (!winPath) return { ok: false, error: "wslpath returned empty" };
        await runPowerShell(saveClipboardPngScript(winPath), { timeoutMs });
        const bytes = fileSize(file);
        return { ok: true, path: file, bytes };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const clear = /no image on clipboard/i.test(msg)
          ? "no image on clipboard"
          : msg;
        return { ok: false, error: clear };
      }
    },
    presentCall: () => ({ card: "generic", title: "Windows screenshot" }),
    presentResult: (_args, result) => (
      result.isError
        ? { card: "generic", title: "Windows screenshot failed", content: result.content }
        : { card: "generic", title: "Windows screenshot", content: result.content }
    ),
  });
}

function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
