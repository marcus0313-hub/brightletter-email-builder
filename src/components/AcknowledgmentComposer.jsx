import { useState } from "react";

const buttonLabels = {
  saw: "I Saw That",
  felt: "I Felt That",
};

const hints = {
  saw: "What effort, intention, or follow-through did you notice?",
  felt: "What support, reassurance, or connection did you feel?",
};

export default function AcknowledgmentComposer({ onSave }) {
  const [activeType, setActiveType] = useState(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function start(type) {
    setActiveType(type);
    setNote("");
    setError("");
  }

  function save() {
    const trimmed = note.trim();

    if (!trimmed) {
      setError("Add a short note so the moment has context.");
      return;
    }

    onSave(activeType, trimmed);
    setActiveType(null);
    setNote("");
    setError("");
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(buttonLabels).map(([type, label]) => (
          <button
            className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${
              activeType === type
                ? type === "saw"
                  ? "bg-moss text-white"
                  : "bg-clay text-white"
                : "bg-linen text-dusk hover:bg-white"
            }`}
            key={type}
            onClick={() => start(type)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {activeType && (
        <div className="mt-3 rounded-lg border border-dusk/10 bg-linen/90 p-3">
          <label className="text-xs font-semibold text-dusk/70">
            {hints[activeType]}
          </label>
          <textarea
            className="mt-2 min-h-24 w-full resize-none rounded-lg border border-dusk/10 bg-white/70 px-3 py-2 text-sm text-dusk placeholder:text-dusk/35"
            onChange={(event) => {
              setNote(event.target.value);
              setError("");
            }}
            placeholder="A sentence or two is enough."
            value={note}
          />
          {error && <p className="mt-2 text-xs text-clay">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button
              className="rounded-lg px-3 py-2 text-sm font-medium text-dusk/60 hover:bg-oat"
              onClick={() => setActiveType(null)}
              type="button"
            >
              Later
            </button>
            <button
              className="rounded-lg bg-dusk px-4 py-2 text-sm font-semibold text-linen"
              onClick={save}
              type="button"
            >
              Save Moment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
