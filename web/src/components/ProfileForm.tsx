import { FormEvent, ReactNode, useState } from "react";

import { Location, OnboardingInput, Profile } from "../api";
import { ENTRY_OPTIONS, FOCUS_OPTIONS, MISUNDERSTOOD_OPTIONS, PRESSURE_OPTIONS } from "../options";
import { LocationPicker } from "./LocationPicker";

interface Draft {
  fullName: string;
  birthDate: string;
  birthTime: string;
  birthTimeKnown: boolean;
  location: Location | null;
  primaryFocus: string;
  secondaryFocus: string;
  pressureResponse: string;
  misunderstoodFor: string;
  entryReason: string;
  entryQuestion: string;
}

function draftFrom(p: Profile | null | undefined): Draft {
  return {
    fullName: p?.fullName ?? "",
    birthDate: p?.birthDate ?? "",
    birthTime: p?.birthTime ?? "",
    birthTimeKnown: p ? p.birthTimeKnown : true,
    location: p?.location ?? null,
    primaryFocus: p?.primaryFocus ?? "",
    secondaryFocus: p?.secondaryFocus ?? "",
    pressureResponse: p?.pressureResponse ?? "",
    misunderstoodFor: p?.misunderstoodFor ?? "",
    entryReason: p?.entryReason ?? "",
    entryQuestion: p?.entryQuestion ?? ""
  };
}

/* Single-choice chips with an optional free-text answer. */
function Choices({
  options,
  value,
  onChange,
  allowOther = false,
  optional = false
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  allowOther?: boolean;
  optional?: boolean;
}) {
  const isOther = value !== "" && !options.includes(value);
  const [otherOpen, setOtherOpen] = useState(isOther);

  return (
    <div>
      <div className="choices" role="radiogroup">
        {options.map((o) => (
          <button
            type="button"
            key={o}
            role="radio"
            aria-checked={value === o}
            className={`choice ${value === o ? "selected" : ""}`}
            onClick={() => {
              setOtherOpen(false);
              onChange(optional && value === o ? "" : o);
            }}
          >
            {o}
          </button>
        ))}
        {allowOther && (
          <button
            type="button"
            role="radio"
            aria-checked={otherOpen}
            className={`choice ${otherOpen ? "selected" : ""}`}
            onClick={() => {
              setOtherOpen(true);
              if (!isOther) onChange("");
            }}
          >
            Something else
          </button>
        )}
      </div>
      {otherOpen && (
        <input
          className="other-input"
          placeholder="In your own words"
          maxLength={200}
          value={isOther ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}

function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="question">
      <h3>{title}</h3>
      {hint && <p className="muted small">{hint}</p>}
      {children}
    </div>
  );
}

const today = new Date().toISOString().slice(0, 10);

const STEPS: { title: string; subtitle: string; validate: (d: Draft) => string | null }[] = [
  {
    title: "Let's start with you",
    subtitle: "Your birth date is the starting point of your chart.",
    validate: (d) =>
      !d.fullName.trim()
        ? "Enter your name."
        : !d.birthDate || d.birthDate > today || d.birthDate < "1900-01-01"
          ? "Enter your date of birth."
          : null
  },
  {
    title: "What time were you born?",
    subtitle: "The time sets your rising sign and houses. A birth certificate or a family member may know it.",
    validate: (d) => (d.birthTimeKnown && !/^\d{2}:\d{2}$/.test(d.birthTime) ? "Enter your birth time, or tick that you don't know it." : null)
  },
  {
    title: "Where were you born?",
    subtitle: "The place gives the time zone and the sky as it was seen from there.",
    validate: (d) => (!d.location ? "Choose your birthplace from the list." : null)
  },
  {
    title: "What would you like guidance on?",
    subtitle: "Saarthi will keep these in mind. You can change them any time.",
    validate: (d) => (!d.primaryFocus ? "Choose what matters most right now." : !d.entryReason ? "Tell us what brings you here." : null)
  },
  {
    title: "A little about how you cope",
    subtitle: "This helps Saarthi support you the way you actually are.",
    validate: (d) => (!d.pressureResponse.trim() ? "Choose how you usually respond to pressure." : null)
  }
];

export function ProfileForm({
  initial,
  mode,
  onSubmit
}: {
  initial?: Profile | null;
  mode: "onboarding" | "edit";
  onSubmit: (input: OnboardingInput) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(initial));
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
    setSaved(false);
  };

  const sections: ReactNode[] = [
    <>
      <Question title="Your name">
        <input value={draft.fullName} maxLength={80} placeholder="Your first name is fine" onChange={(e) => set("fullName", e.target.value)} />
      </Question>
      <Question title="Date of birth">
        <input type="date" value={draft.birthDate} min="1900-01-01" max={today} onChange={(e) => set("birthDate", e.target.value)} />
      </Question>
    </>,
    <Question title="Birth time">
      <input
        type="time"
        value={draft.birthTime}
        disabled={!draft.birthTimeKnown}
        onChange={(e) => set("birthTime", e.target.value)}
      />
      <label className="check">
        <input
          type="checkbox"
          checked={!draft.birthTimeKnown}
          onChange={(e) => set("birthTimeKnown", !e.target.checked)}
        />
        I don't know my birth time
      </label>
      {!draft.birthTimeKnown && (
        <p className="muted small">That's fine. Saarthi will read your chart from your Moon sign; timing will be broader.</p>
      )}
    </Question>,
    <Question title="Birthplace">
      <LocationPicker value={draft.location} onChange={(l) => set("location", l)} />
    </Question>,
    <>
      <Question title="What matters most right now?">
        <Choices options={FOCUS_OPTIONS} value={draft.primaryFocus} onChange={(v) => set("primaryFocus", v)} />
      </Question>
      <Question title="Anything else on your radar?" hint="Optional">
        <Choices
          options={FOCUS_OPTIONS.filter((o) => o !== draft.primaryFocus)}
          value={draft.secondaryFocus}
          onChange={(v) => set("secondaryFocus", v)}
          optional
        />
      </Question>
      <Question title="What brings you to Saarthi?">
        <Choices options={ENTRY_OPTIONS} value={draft.entryReason} onChange={(v) => set("entryReason", v)} />
      </Question>
    </>,
    <>
      <Question title="When pressure builds, what do you usually do?">
        <Choices options={PRESSURE_OPTIONS} value={draft.pressureResponse} onChange={(v) => set("pressureResponse", v)} allowOther />
      </Question>
      <Question title="What do people tend to misunderstand about you?" hint="Optional">
        <Choices
          options={MISUNDERSTOOD_OPTIONS}
          value={draft.misunderstoodFor}
          onChange={(v) => set("misunderstoodFor", v)}
          allowOther
          optional
        />
      </Question>
      <Question title="What's on your mind right now?" hint="Optional. You can start your first conversation with it.">
        <textarea
          rows={3}
          maxLength={500}
          placeholder="I've been feeling stuck at work and don't know whether to stay or move on."
          value={draft.entryQuestion}
          onChange={(e) => set("entryQuestion", e.target.value)}
        />
      </Question>
    </>
  ];

  function toInput(): OnboardingInput {
    return {
      fullName: draft.fullName.trim(),
      birthDate: draft.birthDate,
      birthTime: draft.birthTimeKnown ? draft.birthTime : null,
      birthTimeKnown: draft.birthTimeKnown,
      locationId: draft.location!.id,
      primaryFocus: draft.primaryFocus,
      secondaryFocus: draft.secondaryFocus,
      pressureResponse: draft.pressureResponse.trim(),
      misunderstoodFor: draft.misunderstoodFor.trim(),
      entryReason: draft.entryReason,
      entryQuestion: draft.entryQuestion.trim()
    };
  }

  async function save() {
    setBusy(true);
    try {
      await onSubmit(toInput());
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function next(e: FormEvent) {
    e.preventDefault();
    const problem = STEPS[step].validate(draft);
    if (problem) return setError(problem);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
    } else {
      save();
    }
  }

  function saveAll(e: FormEvent) {
    e.preventDefault();
    for (let i = 0; i < STEPS.length; i++) {
      const problem = STEPS[i].validate(draft);
      if (problem) return setError(problem);
    }
    save();
  }

  if (mode === "edit") {
    return (
      <form onSubmit={saveAll} className="profile-form" noValidate>
        {STEPS.map((s, i) => (
          <section key={s.title} className="card">
            <h2>{s.title}</h2>
            <p className="muted small">{s.subtitle}</p>
            {sections[i]}
          </section>
        ))}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          {saved && <span className="saved">Saved</span>}
          <button className="btn primary" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={next} className="wizard" noValidate>
      <div className="progress" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <span key={s.title} className={i <= step ? "done" : ""} />
        ))}
      </div>
      <h1 className="voice">{STEPS[step].title}</h1>
      <p className="muted">{STEPS[step].subtitle}</p>
      <div className="wizard-body">{sections[step]}</div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        {step > 0 ? (
          <button type="button" className="btn" onClick={() => (setError(null), setStep(step - 1))}>
            Back
          </button>
        ) : (
          <span />
        )}
        <button className="btn primary" disabled={busy}>
          {step < STEPS.length - 1 ? "Next" : busy ? "Reading your chart…" : "Meet Saarthi"}
        </button>
      </div>
    </form>
  );
}
