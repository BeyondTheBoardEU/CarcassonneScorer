import { meepleColours } from "@carcassonne/core";

export interface ColourPickerProps {
  /** Field/row label, e.g. "Player 1 colour" — used for the `<label>`/`aria-label`. */
  label: string;
  /** The colourId currently selected for this row. */
  value: string;
  /** Colour ids already chosen by *other* rows — disabled here to keep colours distinct. */
  takenByOthers: ReadonlySet<string>;
  onChange(colourId: string): void;
}

/**
 * Meeple-colour `<select>` for one player row (Item 015).
 *
 * Sources its options from the core's `meepleColours` (Item 013) — never a
 * locally hard-coded colour list. Each option's visible text is the colour
 * `name` plus its `pattern` token (e.g. "Red (solid)"), so a colour is never
 * identified by hue alone (accessibility NFR): a screen reader announces the
 * name/pattern text, and sighted users get a non-colour cue alongside the
 * swatch. A colour already selected by another row is rendered `disabled` so
 * the chosen set of colours stays distinct.
 */
export function ColourPicker(props: ColourPickerProps): JSX.Element {
  const { label, value, takenByOthers, onChange } = props;
  const inputId = `colour-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <span>
      <label htmlFor={inputId}>{label}</label>
      <select id={inputId} value={value} onChange={(event) => onChange(event.target.value)}>
        {meepleColours.map((colour) => (
          <option
            key={colour.id}
            value={colour.id}
            disabled={takenByOthers.has(colour.id) && colour.id !== value}
            style={{ color: colour.value }}
          >
            {colour.name} ({colour.pattern})
          </option>
        ))}
      </select>
    </span>
  );
}
