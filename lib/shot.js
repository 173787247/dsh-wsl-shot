import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { runPowerShell } from "./wsl-host.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const NO_IMAGE_TOKEN = "DSH_NO_CLIPBOARD_IMAGE";
const NO_IMAGE_HINT =
  "Copy an image to the Windows clipboard first (Win+Shift+S snip, or right-click → Copy image), then retry win_shot.";

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
  if (v.hint) lines.push(`hint: ${v.hint}`);
  return lines.join("\n");
}

function noClipboardImage() {
  return {
    ok: false,
    error: "no image on clipboard",
    hint: NO_IMAGE_HINT,
  };
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
if ($null -eq $img) { Write-Output '${NO_IMAGE_TOKEN}'; exit 0 };
$img.Save('${winTemp.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Png);
'${winTemp.replace(/'/g, "''")}'
`;
  let stdout = "";
  try {
    const result = await runPowerShell(ps, { timeoutMs: 25_000 });
    stdout = String(result.stdout || "").trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/no image on clipboard/i.test(msg) || msg.includes(NO_IMAGE_TOKEN)) {
      return noClipboardImage();
    }
    return { ok: false, error: msg, hint: NO_IMAGE_HINT };
  }
  if (!stdout || stdout.includes(NO_IMAGE_TOKEN)) {
    return noClipboardImage();
  }
  let linuxTemp = "";
  try {
    const { stdout: wslOut } = await execFileAsync("wslpath", ["-u", winTemp.replace(/\\\\/g, "\\")], {
      timeout: 5000,
      encoding: "utf8",
    });
    linuxTemp = String(wslOut).trim();
  } catch {
    return { ok: false, windowsTemp: winTemp, error: "wslpath failed for temp file" };
  }
  const dest = join(outDir, `${base}.png`);
  try {
    const { copyFileSync, unlinkSync } = await import("node:fs");
    copyFileSync(linuxTemp, dest);
    try { unlinkSync(linuxTemp); } catch { /* ignore */ }
  } catch (err) {
    return { ok: false, windowsTemp: winTemp, error: err instanceof Error ? err.message : String(err) };
  }
  return { ok: true, path: dest, windowsTemp: winTemp };
}
