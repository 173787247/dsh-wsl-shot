import { mkdirSync, statSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function jailRoots({ home = homedir(), tmp = tmpdir() } = {}) {
  return [resolve(tmp), resolve(home)].map((p) => p.replace(/\\/g, "/"));
}

export function isJailed(target, roots = jailRoots()) {
  const t = resolve(String(target)).replace(/\\/g, "/");
  return roots.some((root) => t === root || t.startsWith(root.endsWith("/") ? root : root + "/"));
}

export function resolveShotPath(dir, filename = null) {
  const base = resolve(String(dir || "/tmp/dsh-wsl-shot"));
  const name = filename && /^[A-Za-z0-9._-]+$/.test(filename)
    ? filename
    : `clip-${Date.now()}.png`;
  const full = join(base, name).replace(/\\/g, "/");
  return { dir: base.replace(/\\/g, "/"), file: full, name };
}

export function saveClipboardPngScript(winPath) {
  const wp = String(winPath).replace(/'/g, "''");
  return [
    "Add-Type -AssemblyName System.Windows.Forms",
    "Add-Type -AssemblyName System.Drawing",
    "$img = [System.Windows.Forms.Clipboard]::GetImage()",
    "if ($null -eq $img) { throw 'no image on clipboard' }",
    `$img.Save('${wp}', [System.Drawing.Imaging.ImageFormat]::Png)`,
    "'ok'",
  ].join("; ");
}

export async function toWindowsPath(linuxPath, { execFileFn = execFileAsync } = {}) {
  const { stdout } = await execFileFn("wslpath", ["-w", linuxPath], {
    encoding: "utf8",
    timeout: 5_000,
  });
  return String(stdout || "").trim();
}

export function ensureShotDir(dir) {
  mkdirSync(dir, { recursive: true });
}

export function fileSize(path) {
  return statSync(path).size;
}

export function formatShotResult(payload) {
  const lines = ["win_shot"];
  if (payload.ok === false) {
    lines.push(`error: ${payload.error || "failed"}`);
    return lines.join("\n");
  }
  lines.push(`path: ${payload.path}`);
  lines.push(`bytes: ${payload.bytes}`);
  return lines.join("\n");
}
