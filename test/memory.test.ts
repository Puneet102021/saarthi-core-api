import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyFactOps, Fact, FOLD_BATCH, MAX_FACTS, memoryBlock, planFold, SHORT_TERM_MESSAGES } from "../src/memory/core";

const fact = (id: string, text: string, importance: 1 | 2 | 3 = 2, category: Fact["category"] = "life"): Fact => ({
  id,
  category,
  text,
  eventDate: null,
  importance,
  updatedAt: new Date(2026, 0, Number(id.replace(/\D/g, "")) || 1)
});

describe("planFold", () => {
  const msgs = (n: number) => Array.from({ length: n }, (_, i) => i);

  it("leaves the short-term window alone until enough has left it", () => {
    assert.deepEqual(planFold(msgs(SHORT_TERM_MESSAGES)), []);
    assert.deepEqual(planFold(msgs(SHORT_TERM_MESSAGES + 3)), []);
  });

  it("folds everything older than the window, oldest first", () => {
    assert.deepEqual(planFold(msgs(SHORT_TERM_MESSAGES + 4)), [0, 1, 2, 3]);
  });

  it("works through a long backlog in batches", () => {
    assert.equal(planFold(msgs(200)).length, FOLD_BATCH);
    assert.equal(planFold(msgs(200))[0], 0);
  });
});

describe("applyFactOps", () => {
  const existing = [fact("f1", "Works as a nurse in Pune"), fact("f2", "Sister is called Meera", 3, "people")];

  it("adds new notes and skips duplicates of existing ones", () => {
    const changes = applyFactOps(existing, {
      add: [
        { category: "event", text: "Job interview at a hospital", eventDate: "2026-12-05", importance: 2 },
        { category: "people", text: "Sister is called Meera.", eventDate: null, importance: 3 }
      ],
      update: [],
      remove: []
    });
    assert.equal(changes.create.length, 1);
    assert.equal(changes.create[0].eventDate, "2026-12-05");
  });

  it("ignores unknown ids, bad categories and bad dates", () => {
    const changes = applyFactOps(existing, {
      add: [{ category: "secret", text: "x", eventDate: null, importance: 2 }],
      update: [{ id: "nope", category: "life", text: "y", eventDate: null, importance: 2 }],
      remove: ["nope", "f1"]
    });
    assert.deepEqual(changes.create, []);
    assert.deepEqual(changes.update, []);
    assert.deepEqual(changes.remove, ["f1"]);

    const dated = applyFactOps([], { add: [{ category: "event", text: "Exam", eventDate: "next week", importance: 9 }], update: [], remove: [] });
    assert.equal(dated.create[0].eventDate, null);
    assert.equal(dated.create[0].importance, 3);
  });

  it("updates a note in place", () => {
    const changes = applyFactOps(existing, {
      add: [],
      update: [{ id: "f1", category: "work", text: "Now works as a senior nurse in Pune", eventDate: null, importance: 2 }],
      remove: []
    });
    assert.equal(changes.update[0].category, "work");
  });

  it("keeps within the cap by dropping the least important, oldest notes", () => {
    const many = Array.from({ length: MAX_FACTS }, (_, i) => fact(`f${i + 1}`, `note ${i + 1}`, i === 0 ? 1 : 2));
    const changes = applyFactOps(many, {
      add: [{ category: "goal", text: "Wants to move abroad", eventDate: null, importance: 3 }],
      update: [],
      remove: []
    });
    assert.deepEqual(changes.remove, ["f1"]);
  });
});

describe("memoryBlock", () => {
  it("is empty when there is nothing to remember", () => {
    assert.equal(memoryBlock({ running: null, facts: [] }), null);
  });

  it("groups notes by kind and includes the running summary", () => {
    const block = memoryBlock({
      running: "They have been anxious about an interview.",
      facts: [fact("f1", "Sister is called Meera", 3, "people"), { ...fact("f2", "Job interview"), category: "event", eventDate: "2026-12-05" }]
    })!;
    assert.match(block, /People in their life:\n- Sister is called Meera/);
    assert.match(block, /- Job interview \(2026-12-05\)/);
    assert.match(block, /WHERE YOUR CONVERSATION HAS BEEN LATELY/);
  });
});
