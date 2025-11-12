import test from "node:test";
import assert from "node:assert/strict";
import { aggregateYearData, hasYearData, normalizeEntry, serializeEntry } from "../data";
import type { StoredEntry } from "../data";

test("normalizeEntry handles strings and split objects", () => {
  assert.deepEqual(normalizeEntry("Good"), { first: "Good", second: null });

  assert.deepEqual(normalizeEntry({ first: "Okay", second: "Bad" }), { first: "Okay", second: "Bad" });

  assert.deepEqual(normalizeEntry({ primary: "Great", secondary: "Good" }), { first: "Great", second: "Good" });

  // When only a secondary mood is supplied, treat it as the primary mood.
  assert.deepEqual(normalizeEntry({ second: "Awful" }), { first: "Awful", second: null });

  assert.equal(normalizeEntry(null), null);
});

test("serializeEntry collapses to string when there is no split", () => {
  assert.equal(serializeEntry({ first: "Great", second: null }), "Great");
  assert.deepEqual(serializeEntry({ first: "Okay", second: "Bad" }), { first: "Okay", second: "Bad" });
});

test("aggregateYearData counts whole and split days correctly", () => {
  const entries = {
    "2024-01-01": "Great",
    "2024-01-02": { first: "Good", second: "Bad" },
    "2024-02-10": { first: "Awful" },
    "2023-03-01": "Okay", // ignored because of year mismatch
  } as const satisfies Record<string, StoredEntry>;

  const aggregated = aggregateYearData(entries, 2024);
  const january = aggregated.find((row) => row.month === "Jan");
  const february = aggregated.find((row) => row.month === "Feb");

  assert.ok(january, "Expected January row to be present");
  assert.ok(february, "Expected February row to be present");

  assert.equal(january.Great, 1);
  assert.equal(january.Good, 0.5);
  assert.equal(january.Bad, 0.5);
  assert.equal(january.Awful, 0);

  assert.equal(february.Awful, 1);
});

test("hasYearData detects when any month has logged entries", () => {
  const emptyYear = aggregateYearData({}, 2024);
  assert.equal(hasYearData(emptyYear), false);

  const withData = aggregateYearData({ "2024-04-15": "Okay" }, 2024);
  assert.equal(hasYearData(withData), true);
});
