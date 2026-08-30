import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatShotResult,
  isJailed,
  resolveShotPath,
  saveClipboardPngScript,
} from "../lib/shot.js";

describe("win_shot", () => {
  it("jails under tmp/home", () => {
    assert.equal(isJailed("/tmp/dsh-wsl-shot/a.png", ["/tmp", "/home/u"]), true);
    assert.equal(isJailed("/etc/passwd", ["/tmp", "/home/u"]), false);
  });

  it("resolves shot path", () => {
    const r = resolveShotPath("/tmp/dsh-wsl-shot", "x.png");
    assert.equal(r.name, "x.png");
    assert.match(r.file, /x\.png$/);
  });

  it("rejects unsafe filename", () => {
    const r = resolveShotPath("/tmp/dsh-wsl-shot", "../x.png");
    assert.match(r.name, /^clip-/);
  });

  it("builds clipboard save script", () => {
    assert.match(saveClipboardPngScript("C:\\t\\a.png"), /GetImage/);
    assert.match(saveClipboardPngScript("C:\\t\\a.png"), /no image on clipboard/);
  });

  it("formats", () => {
    assert.match(formatShotResult({ ok: true, path: "/tmp/a.png", bytes: 12 }), /bytes: 12/);
    assert.match(formatShotResult({ ok: false, error: "no image on clipboard" }), /no image/);
  });
});
