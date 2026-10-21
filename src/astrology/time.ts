import type { BirthInput } from "./types";

export interface LocalDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function parseBirthDate(date: string): {
  year: number;
  month: number;
  day: number;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim());

  if (!match) {
    throw new Error(`Birth date must be YYYY-MM-DD, got "${date}"`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const check = new Date(Date.UTC(year, month - 1, day));

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error(`Birth date is not a real date: "${date}"`);
  }

  return { year, month, day };
}

/* Accepts "14:05", "14:05:30", "2:05 PM", "02:05:30 am". */
export function parseBirthTime(time: string): {
  hour: number;
  minute: number;
  second: number;
} {
  const match = /^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?m\.?)?\s*$/i.exec(time);

  if (!match) {
    throw new Error(`Birth time must be HH:mm, got "${time}"`);
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] || 0);
  const meridiem = match[4]?.toLowerCase().replace(/\./g, "");

  if (meridiem) {
    if (hour < 1 || hour > 12) {
      throw new Error(`Invalid 12-hour time: "${time}"`);
    }
    if (meridiem === "am" && hour === 12) hour = 0;
    if (meridiem === "pm" && hour !== 12) hour += 12;
  }

  if (hour > 23 || minute > 59 || second > 59) {
    throw new Error(`Invalid birth time: "${time}"`);
  }

  return { hour, minute, second };
}

/*
  Offset of an IANA zone from UTC, in minutes, at a UTC instant. Uses the
  runtime's tz database, which carries India's historical offsets (e.g. +06:30
  war time in 1942-45) as well as daylight saving elsewhere.
*/
export function zoneOffsetMinutes(timeZone: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(new Date(utcMs));

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );

  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
}

export function localToUtc(
  local: LocalDateTime,
  zone: { timezone?: string; utcOffsetMinutes?: number }
): Date {
  const wallAsUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second
  );

  if (typeof zone.utcOffsetMinutes === "number") {
    return new Date(wallAsUtc - zone.utcOffsetMinutes * 60000);
  }

  if (!zone.timezone) {
    throw new Error("A timezone or utcOffsetMinutes is required to place the birth time");
  }

  /* Two passes settle the offset even across a DST or historical change. */
  let utc = wallAsUtc - zoneOffsetMinutes(zone.timezone, wallAsUtc) * 60000;
  utc = wallAsUtc - zoneOffsetMinutes(zone.timezone, utc) * 60000;

  return new Date(utc);
}

/*
  Birth instant in UTC. An unknown time is taken as local noon, which keeps
  the Moon within about 7 degrees of its true place; callers must treat the
  ascendant and houses as unreliable in that case.
*/
export function birthInstant(input: BirthInput): {
  utc: Date;
  timeKnown: boolean;
} {
  const { year, month, day } = parseBirthDate(input.date);

  const timeKnown = Boolean(input.time && input.time.trim());

  const { hour, minute, second } = timeKnown
    ? parseBirthTime(input.time as string)
    : { hour: 12, minute: 0, second: 0 };

  const utc = localToUtc(
    { year, month, day, hour, minute, second },
    input
  );

  return { utc, timeKnown };
}
