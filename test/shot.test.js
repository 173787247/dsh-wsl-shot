import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { format } from "../lib/shot.js";

describe("win_shot", () => {
  it("formats", () => {
    assert.match(format({ ok: true }), /ok/i);
  });

  it("formats no-image with hint", () => {
    const text = format({
      ok: false,
      error: "no image on clipboard",
      hint: "Copy an image first",
    });
    assert.match(text, /no image on clipboard/);
    assert.match(text, /hint: Copy an image first/);
  });
});
