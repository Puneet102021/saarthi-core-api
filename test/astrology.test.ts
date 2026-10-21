import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sweph from "sweph";

import { buildNatalChart } from "../src/astrology/chart";
import type { Planet } from "../src/astrology/constants";
import { dashaAt, subPeriods, vimshottariAtBirth } from "../src/astrology/dasha";
import { compoundRelationship, dignityOf } from "../src/astrology/dignity";
import { ayanamsaAt, julianDayUt, planetaryPositions, siderealAscendant } from "../src/astrology/ephemeris";
import { functionalNature, ownedHouses } from "../src/astrology/functional";
import { indexOfSign, nakshatraOf, norm360 } from "../src/astrology/math";
import { birthInstant, parseBirthTime } from "../src/astrology/time";
import { transitSegments } from "../src/astrology/transits";
import { dashamsaSign, navamsaSign, saptamsaSign } from "../src/astrology/vargas";
import { kaalSarp } from "../src/astrology/yogas/doshas";
import { neechaBhangaFor } from "../src/astrology/yogas";

const DAY = 24 * 60 * 60 * 1000;
const YEAR = 365.25 * DAY;

describe("time", () => {
  it("converts Indian local time to UTC", () => {
    const { utc } = birthInstant({ date: "1990-08-15", time: "10:30", timezone: "Asia/Kolkata", latitude: 0, longitude: 0 });
    assert.equal(utc.toISOString(), "1990-08-15T05:00:00.000Z");
  });

  it("applies India's war-time offset (+06:30, 1942-45) from the tz database", () => {
    const { utc } = birthInstant({ date: "1943-06-01", time: "12:00", timezone: "Asia/Kolkata", latitude: 0, longitude: 0 });
    assert.equal(utc.toISOString(), "1943-06-01T05:30:00.000Z");
  });

  it("honours an explicit UTC offset (local mean time)", () => {
    const { utc } = birthInstant({ date: "1869-10-02", time: "07:11", utcOffsetMinutes: 278, latitude: 0, longitude: 0 });
    assert.equal(utc.toISOString(), "1869-10-02T02:33:00.000Z");
  });

  it("reads 12-hour times", () => {
    assert.deepEqual(parseBirthTime("12:05 am"), { hour: 0, minute: 5, second: 0 });
    assert.deepEqual(parseBirthTime("2:30 PM"), { hour: 14, minute: 30, second: 0 });
    assert.throws(() => parseBirthTime("25:00"));
  });

  it("falls back to local noon when the time is unknown", () => {
    const { utc, timeKnown } = birthInstant({ date: "2000-01-01", time: null, timezone: "Asia/Kolkata", latitude: 0, longitude: 0 });
    assert.equal(timeKnown, false);
    assert.equal(utc.toISOString(), "2000-01-01T06:30:00.000Z");
  });
});

describe("ephemeris", () => {
  const j2000 = julianDayUt(new Date("2000-01-01T12:00:00Z"));

  it("uses Lahiri ayanamsa (23.85° at J2000)", () => {
    assert.ok(Math.abs(ayanamsaAt(j2000).value - 23.853) < 0.01);
  });

  it("gives sidereal positions: Sun in Sagittarius ~16.5° at J2000", () => {
    const sun = planetaryPositions(j2000).find((p) => p.planet === "Sun")!;
    assert.equal(sun.sign, "Sagittarius");
    assert.ok(Math.abs(sun.degree - 16.5) < 0.3, `Sun at ${sun.degree}`);
  });

  it("puts Ketu exactly opposite Rahu", () => {
    const positions = planetaryPositions(j2000);
    const rahu = positions.find((p) => p.planet === "Rahu")!;
    const ketu = positions.find((p) => p.planet === "Ketu")!;
    assert.ok(Math.abs(norm360(ketu.longitude - rahu.longitude) - 180) < 1e-9);
  });

  it("computes a sidereal ascendant (tropical minus ayanamsa), not a tropical one", () => {
    const jd = julianDayUt(new Date("1990-08-15T05:00:00Z"));
    const tropical = sweph.houses(jd, 28.61, 77.21, "P").data.points[0];
    const sidereal = siderealAscendant(jd, 28.61, 77.21);
    const expected = norm360(tropical - ayanamsaAt(jd).value);
    assert.ok(Math.abs(sidereal - expected) < 1e-6, `${sidereal} vs ${expected}`);
  });
});

describe("nakshatras", () => {
  it("handles boundaries", () => {
    assert.deepEqual(nakshatraOf(0), { name: "Ashwini", index: 0, pada: 1, lord: "Ketu" });
    assert.equal(nakshatraOf(360 / 27 + 1e-9).name, "Bharani");
    assert.equal(nakshatraOf(3.34).pada, 2);
    const last = nakshatraOf(359.9999);
    assert.equal(last.name, "Revati");
    assert.equal(last.pada, 4);
  });
});

describe("divisional charts", () => {
  const at = (sign: string, degree: number) => indexOfSign(sign as never) * 30 + degree;

  it("navamsa (D9) counts continuously from Aries", () => {
    assert.equal(navamsaSign(at("Aries", 0)), "Aries");
    assert.equal(navamsaSign(at("Aries", 29.9)), "Sagittarius");
    assert.equal(navamsaSign(at("Taurus", 0)), "Capricorn");
    assert.equal(navamsaSign(at("Gemini", 0)), "Libra");
    assert.equal(navamsaSign(at("Cancer", 0)), "Cancer");
    assert.equal(navamsaSign(at("Pisces", 29.9)), "Pisces");
  });

  it("dashamsa (D10): odd signs from themselves, even signs from the 9th", () => {
    assert.equal(dashamsaSign(at("Aries", 0)), "Aries");
    assert.equal(dashamsaSign(at("Aries", 29)), "Capricorn");
    assert.equal(dashamsaSign(at("Taurus", 0)), "Capricorn");
    assert.equal(dashamsaSign(at("Taurus", 29)), "Libra");
  });

  it("saptamsa (D7): odd signs from themselves, even signs from the 7th", () => {
    assert.equal(saptamsaSign(at("Aries", 0)), "Aries");
    assert.equal(saptamsaSign(at("Taurus", 0)), "Scorpio");
  });
});

describe("dignity", () => {
  const none = {};

  it("splits the Moon's Taurus between exaltation and moolatrikona", () => {
    assert.equal(dignityOf("Moon", "Taurus", 2, none), "exalted");
    assert.equal(dignityOf("Moon", "Taurus", 10, none), "moolatrikona");
  });

  it("splits Mercury's Virgo into exaltation, moolatrikona and own sign", () => {
    assert.equal(dignityOf("Mercury", "Virgo", 10, none), "exalted");
    assert.equal(dignityOf("Mercury", "Virgo", 17, none), "moolatrikona");
    assert.equal(dignityOf("Mercury", "Virgo", 25, none), "own");
  });

  it("knows debilitation and leaves the nodes undignified", () => {
    assert.equal(dignityOf("Sun", "Libra", 10, none), "debilitated");
    assert.equal(dignityOf("Rahu", "Taurus", 10, none), null);
  });

  it("combines natural and temporal friendship", () => {
    assert.equal(compoundRelationship("enemy", "friend"), "neutral");
    assert.equal(compoundRelationship("friend", "friend"), "great_friend");
    assert.equal(compoundRelationship("neutral", "enemy"), "enemy");
    /* Saturn in Leo; the Sun two signs on (Virgo) is a temporal friend; natural enemy: neutral. */
    const signs: Partial<Record<Planet, number>> = { Saturn: indexOfSign("Leo"), Sun: indexOfSign("Virgo") };
    assert.equal(dignityOf("Saturn", "Leo", 5, signs), "neutral");
  });
});

describe("functional nature", () => {
  const natureFor = (lagna: string, planet: Planet) =>
    functionalNature(planet, ownedHouses(indexOfSign(lagna as never))[planet]);

  it("finds the classical yogakarakas", () => {
    assert.equal(natureFor("Taurus", "Saturn"), "yogakaraka");
    assert.equal(natureFor("Libra", "Saturn"), "yogakaraka");
    assert.equal(natureFor("Cancer", "Mars"), "yogakaraka");
    assert.equal(natureFor("Leo", "Mars"), "yogakaraka");
    assert.equal(natureFor("Capricorn", "Venus"), "yogakaraka");
    assert.equal(natureFor("Aquarius", "Venus"), "yogakaraka");
  });

  it("marks lords of 3, 6 and 11 malefic and trikona lords benefic", () => {
    assert.equal(natureFor("Aries", "Mercury"), "malefic");
    assert.equal(natureFor("Gemini", "Mars"), "malefic");
    assert.equal(natureFor("Aries", "Sun"), "benefic");
    assert.equal(natureFor("Aries", "Mars"), "benefic");
  });
});

describe("vimshottari dasha", () => {
  const birth = new Date("2000-01-01T00:00:00Z");

  it("starts in Ketu with the full 7 years at 0° Ashwini", () => {
    const d = vimshottariAtBirth(0, birth);
    assert.equal(d.birthLord, "Ketu");
    assert.equal(d.balanceAtBirthYears, 7);
    assert.equal(d.mahadashas[0].start, birth.toISOString());
  });

  it("dates the birth mahadasha from before birth", () => {
    /* Halfway through Bharani: Venus, 10 of 20 years already run. */
    const d = vimshottariAtBirth(360 / 27 * 1.5, birth);
    assert.equal(d.birthLord, "Venus");
    assert.equal(d.balanceAtBirthYears, 10);
    const started = Date.parse(d.mahadashas[0].start);
    assert.ok(Math.abs(birth.getTime() - started - 10 * YEAR) < 1000);
  });

  it("divides periods exactly and in order", () => {
    const d = vimshottariAtBirth(123.456, birth);
    const md = d.mahadashas[1];
    const ads = subPeriods(md);
    assert.equal(ads[0].lord, md.lord);
    assert.equal(ads[0].start, md.start);
    assert.ok(Math.abs(Date.parse(ads[8].end) - Date.parse(md.end)) < 5);
    const pds = subPeriods(ads[3]);
    assert.equal(pds[0].lord, ads[3].lord);
    assert.ok(Math.abs(Date.parse(pds[8].end) - Date.parse(ads[3].end)) < 5);
  });

  it("finds the running periods at any date", () => {
    const d = vimshottariAtBirth(200, birth);
    const at = new Date("2031-07-04T00:00:00Z");
    const running = dashaAt(d.mahadashas, at)!;
    for (const p of [running.mahadasha, running.antardasha, running.pratyantardasha]) {
      assert.ok(Date.parse(p.start) <= at.getTime() && at.getTime() < Date.parse(p.end));
    }
    assert.deepEqual(running.pratyantardasha.path.slice(0, 2), running.antardasha.path);
  });
});

describe("transits", () => {
  /* Widely published Indian dates: Saturn into Pisces 29 Mar 2025, Jupiter into Gemini 14 May 2025. */
  const chart = buildNatalChart({ date: "1990-08-15", time: "10:30", timezone: "Asia/Kolkata", latitude: 28.61, longitude: 77.21 });

  it("finds sidereal ingress dates to within a day", () => {
    const segments = transitSegments(chart, new Date("2025-01-01"), new Date("2025-12-31"), ["Saturn", "Jupiter"]);
    const saturn = segments.find((s) => s.planet === "Saturn" && s.sign === "Pisces")!;
    const jupiter = segments.find((s) => s.planet === "Jupiter" && s.sign === "Gemini")!;
    assert.ok(Math.abs(Date.parse(saturn.start) - Date.parse("2025-03-29T12:00:00Z")) < DAY, saturn.start);
    assert.ok(Math.abs(Date.parse(jupiter.start) - Date.parse("2025-05-14T12:00:00Z")) < DAY, jupiter.start);
  });
});

describe("reference chart: M. K. Gandhi, 2 Oct 1869, 07:11 LMT, Porbandar", () => {
  const chart = buildNatalChart({
    date: "1869-10-02",
    time: "07:11",
    utcOffsetMinutes: 278,
    latitude: 21.6417,
    longitude: 69.6293
  });

  const signOf = (planet: Planet) => chart.planets.find((p) => p.planet === planet)!.sign;

  it("matches the published chart", () => {
    assert.equal(chart.ascendant.sign, "Libra");
    assert.equal(signOf("Sun"), "Virgo");
    assert.equal(signOf("Moon"), "Cancer");
    assert.equal(signOf("Mars"), "Libra");
    assert.equal(signOf("Mercury"), "Libra");
    assert.equal(signOf("Venus"), "Libra");
    assert.equal(signOf("Jupiter"), "Aries");
    assert.equal(signOf("Saturn"), "Scorpio");
    assert.equal(signOf("Rahu"), "Cancer");
    assert.equal(signOf("Ketu"), "Capricorn");
  });

  it("starts in Mercury dasha (Moon in Ashlesha)", () => {
    assert.equal(chart.dasha.birthNakshatra, "Ashlesha");
    assert.equal(chart.dasha.birthLord, "Mercury");
  });

  it("finds Malavya yoga (Venus in Libra on the ascendant)", () => {
    assert.ok(chart.yogas.some((y) => y.id === "MALAVYA"));
  });
});

describe("yoga rules", () => {
  const fake = (longitudes: Partial<Record<Planet, number>>) => ({
    birthTimeKnown: true,
    planets: Object.entries(longitudes).map(([planet, longitude]) => ({
      planet,
      longitude,
      signIndex: Math.floor(longitude! / 30),
      sign: "Aries",
      house: Math.floor(longitude! / 30) + 1
    }))
  }) as never;

  it("detects Kaal Sarp in both directions", () => {
    const inside = { Sun: 20, Moon: 40, Mars: 60, Mercury: 80, Jupiter: 100, Venus: 120, Saturn: 140 };
    assert.equal(kaalSarp(fake({ Rahu: 10, Ketu: 190, ...inside })).length, 1);
    assert.equal(kaalSarp(fake({ Rahu: 190, Ketu: 10, ...inside })).length, 1);
    assert.equal(kaalSarp(fake({ Rahu: 10, Ketu: 190, ...inside, Saturn: 250 })).length, 0);
  });

  it("cancels a debilitation when the sign lord is in a kendra", () => {
    /* Sun debilitated in Libra (house 7); Venus, lord of Libra, in the 10th. */
    const placed = (planet: Planet, signIndex: number) => ({
      planet,
      sign: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"][signIndex] as never,
      signIndex,
      house: signIndex + 1,
      d9Sign: "Gemini" as never,
      aspectsHouses: []
    });
    const planets = [placed("Sun", 6), placed("Venus", 9), placed("Mars", 1), placed("Saturn", 2), placed("Moon", 4)];
    const met = neechaBhangaFor("Sun", planets, 4);
    assert.ok(met.some((m) => m.startsWith("Venus")), met.join("; "));
    assert.deepEqual(neechaBhangaFor("Venus", planets, 4), []);
  });
});
