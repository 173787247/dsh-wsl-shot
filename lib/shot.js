import { mkdirSync, statSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const posix = path.posix;

function toPosix(p) {
  return String(p || "").replace(/\\/g, "/");
}

export function jailRoots({ home = homedir(), tmp = tmpdir() } = {}) {
  // Prefer explicit Linux jail roots when running under WSL-style absolute paths.
  const roots = ["/tmp", toPosix(tmp), toPosix(home)].filter(Boolean);
  // Dedupe
  return [...new Set(roots.map((r) => posix.normalize(r)))];
}

export function isJailed(target, roots = jailRoots()) {
  const t = posix.normalize(toPosix(target));
  return roots.some((root) => {
    const r = posix.normalize(toPosix(root));
    return t === r || t.startsWith(r.endsWith("/") ? r : `${r}/`);
  });
}

export function resolveShotPath(dir, filename = null) {
  const base = posix.normalize(toPosix(dir || "/tmp/dsh-wsl-shot"));
  const name = filename && /^[A-Za-z0-9._-]+$/.test(filename)
    ? filename
    : `clip-${Date.now()}.png`;
  const full = posix.join(base, name);
  return { dir: base, file: full, name };
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

export function fileSize(pathName) {
  return statSync(pathName).size;
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
