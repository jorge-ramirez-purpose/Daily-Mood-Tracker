import test from "node:test";
import assert from "node:assert/strict";
import { parseDateKey } from "../dateHelpers";

test("parseDateKey returns a Date object for valid ISO key", () => {
  const result = parseDateKey("2024-12-25");
  assert.equal(result.getFullYear(), 2024);
  assert.equal(result.getMonth(), 11);
  assert.equal(result.getDate(), 25);
});

test("parseDateKey defaults missing components to the first of the month", () => {
  const result = parseDateKey("2024-02");
  assert.equal(result.getFullYear(), 2024);
  assert.equal(result.getMonth(), 1);
  assert.equal(result.getDate(), 1);
});

test("parseDateKey falls back to provided date when input is invalid", () => {
  const fallback = new Date("2020-01-01T00:00:00Z");
  const result = parseDateKey("invalid-key", fallback);
  assert.equal(result.getTime(), fallback.getTime());
  assert.notStrictEqual(result, fallback);
});
