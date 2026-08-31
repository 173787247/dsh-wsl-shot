import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir, tmpdir } from "node:os";
import { runPowerShell } from "./wsl-host.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function notWsl() {
  return { ok: false, error: "not running in WSL" };
}

export function parameters() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      outDir: { type: "string", description: "Output directory under WSL (default ~/.dsh/shots)." },
      name: { type: "string", description: "File basename without extension." },
    },
  };
}

export function outputSchema() {
  return { type: "object", additionalProperties: true };
}

export function format(v) {
  const lines = [`win_shot ok=${v.ok}`];
  if (v.path) lines.push(`path: ${v.path}`);
  if (v.windowsTemp) lines.push(`windowsTemp: ${v.windowsTemp}`);
  if (v.error) lines.push(`error: ${v.error}`);
  return lines.join("\n");
}

export async function execute(args) {
  const outDir = typeof args?.outDir === "string" && args.outDir.trim()
    ? args.outDir.trim()
    : join(homedir(), ".dsh", "shots");
  mkdirSync(outDir, { recursive: true });
  const base = (typeof args?.name === "string" && args.name.trim() ? args.name.trim() : `shot-${Date.now()}`)
    .replace(/[^\w.-]+/g, "_");
  const winTemp = `C:\\\\Users\\\\Public\\\\dsh-shot-${Date.now()}.png`;
  const ps = `
Add-Type -AssemblyName System.Windows.Forms;
$img = [System.Windows.Forms.Clipboard]::GetImage();
if ($null -eq $img) { throw 'no image on clipboard' };
$img.Save('${winTemp.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Png);
'${winTemp.replace(/'/g, "''")}'
`;
  try {
    await runPowerShell(ps, { timeoutMs: 25_000 });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  let linuxTemp = "";
  try {
    const { stdout } = await execFileAsync("wslpath", ["-u", winTemp.replace(/\\\\/g, "\\")], {
      timeout: 5000,
      encoding: "utf8",
    });
    linuxTemp = String(stdout).trim();
  } catch (err) {
    return { ok: false, windowsTemp: winTemp, error: "wslpath failed for temp file" };
  }
  const dest = join(outDir, `${base}.png`);
  try {
    const { readFileSync, copyFileSync, unlinkSync } = await import("node:fs");
    copyFileSync(linuxTemp, dest);
    try { unlinkSync(linuxTemp); } catch {}
  } catch (err) {
    return { ok: false, windowsTemp: winTemp, error: err instanceof Error ? err.message : String(err) };
  }
  return { ok: true, path: dest, windowsTemp: winTemp };
}
