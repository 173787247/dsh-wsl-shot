import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { format } from "../lib/shot.js";

describe("win_shot", () => {
  it("formats", () => {
    assert.match(format({ ok: true }), /ok/i);
  });
});
