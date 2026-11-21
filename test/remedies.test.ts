import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PLANETS } from "../src/astrology/constants";
import { sanitise } from "../src/reading/ask";
import { taraFor } from "../src/reading/daily";
import { normaliseProfile, profileBlock } from "../src/reading/profile";
import { REMEDIES } from "../src/reading/remedies";

describe("remedy catalogue", () => {
  it("gives every planet a practical, a psychological and a traditional remedy", () => {
    for (const planet of PLANETS) {
      for (const kind of ["practical", "psychological", "traditional"] as const) {
        assert.ok(
          REMEDIES.some((r) => r.planet === planet && r.kind === kind),
          `${planet} has no ${kind} remedy`
        );
      }
    }
  });

  it("has unique ids", () => {
    assert.equal(new Set(REMEDIES.map((r) => r.id)).size, REMEDIES.length);
  });

  it("never sells anything", () => {
    const banned = /\b(gem\w*|stones?|rings?|buy\w*|purchas\w*|paid|fees?|price|money back|guarantee\w*)\b/i;
    for (const r of REMEDIES) {
      const text = [r.title, r.practice, r.why, r.strengthen ?? ""].join(" ");
      assert.doesNotMatch(text, banned, r.id);
    }
  });

  it("marks traditional practices optional", () => {
    for (const r of REMEDIES.filter((r) => r.kind === "traditional")) {
      assert.match(r.title, /optional/i, r.id);
    }
  });
});

describe("profile", () => {
  it("trims, drops empty fields and caps lengths", () => {
    const profile = normaliseProfile({
      name: "  Ravi  ",
      primaryFocus: "   ",
      pressureResponse: "x".repeat(500),
      entryQuestion: 42
    });
    assert.deepEqual(Object.keys(profile).sort(), ["name", "pressureResponse"]);
    assert.equal(profile.name, "Ravi");
    assert.equal(profile.pressureResponse!.length, 200);
  });

  it("has no block when only the name is known", () => {
    assert.equal(profileBlock({ name: "Ravi" }), null);
    assert.match(profileBlock({ misunderstoodFor: "being blunt" })!, /being blunt/);
  });
});

describe("citations", () => {
  it("strips evidence and remedy citations that were not offered", () => {
    const ids = new Set(["E1", "E2", "R1", "R2", "R3"]);
    assert.equal(sanitise("Steady now [E1, E9]. Try this [R9]. Or [R2].", ids), "Steady now [E1]. Try this . Or [R2].");
  });
});

describe("tara bala", () => {
  it("counts the nakshatra from the birth star", () => {
    assert.equal(taraFor(0, 0).name, "Janma");
    assert.equal(taraFor(0, 1).name, "Sampat");
    assert.equal(taraFor(26, 0).name, "Sampat");
    assert.equal(taraFor(0, 9).name, "Janma");
    assert.equal(taraFor(0, 8).name, "Parama Mitra");
  });
});
