import { useEffect, useId, useRef, useState } from "react";

import { api, Location } from "../api";

/* Type-ahead search over the places the API knows, with keyboard support. */
export function LocationPicker({
  value,
  onChange
}: {
  value: Location | null;
  onChange: (location: Location | null) => void;
}) {
  const [query, setQuery] = useState(value ? `${value.name}, ${value.state}` : "");
  const [results, setResults] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const listId = useId();
  const latest = useRef(0);

  useEffect(() => {
    if (value && query === `${value.name}, ${value.state}`) return;

    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const ticket = ++latest.current;
    setLoading(true);

    const timer = setTimeout(() => {
      api
        .searchLocations(q)
        .then((list) => {
          if (ticket !== latest.current) return;
          setResults(list);
          setActive(0);
          setOpen(true);
        })
        .catch(() => ticket === latest.current && setResults([]))
        .finally(() => ticket === latest.current && setLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query, value]);

  function choose(location: Location) {
    onChange(location);
    setQuery(`${location.name}, ${location.state}`);
    setOpen(false);
  }

  return (
    <div className="combo">
      <input
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Start typing your town or city"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (value) onChange(null);
        }}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && (
        <ul className="combo-list" id={listId} role="listbox">
          {results.length === 0 && !loading && <li className="combo-empty">No places match. Try a nearby city.</li>}
          {results.map((l, i) => (
            <li
              key={l.id}
              role="option"
              aria-selected={i === active}
              className={i === active ? "active" : ""}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(l);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span>{l.name}</span>
              <span className="muted small">{l.state}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
