import { useState } from "react";
import MomentPreview from "../components/MomentPreview.jsx";

const acknowledgeTypes = [
  {
    id: "saw",
    title: "I Saw That",
    body: "You noticed effort, intention, or follow-through.",
    className: "bg-moss",
  },
  {
    id: "felt",
    title: "I Felt That",
    body: "You felt supported, reassured, or connected.",
    className: "bg-clay",
  },
];

export default function Acknowledge({
  onAddUnpromptedMoment,
  onToggleUnpromptedPreserved,
  unpromptedMoments,
}) {
  const [activeType, setActiveType] = useState(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function saveMoment() {
    const trimmed = note.trim();

    if (!activeType || !trimmed) {
      setError("Add a short note so the moment has context.");
      return;
    }

    onAddUnpromptedMoment(activeType, trimmed);
    setActiveType(null);
    setNote("");
    setError("");
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4">
        {acknowledgeTypes.map((type) => {
          const isActive = activeType === type.id;

          return (
            <button
              className={`rounded-lg p-6 text-center text-white shadow-soft transition ${
                type.className
              } ${isActive ? "ring-4 ring-white/75" : ""}`}
              key={type.id}
              onClick={() => {
                setActiveType(type.id);
                setError("");
              }}
              type="button"
            >
              <div
                aria-hidden="true"
                className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-white/55 text-3xl"
              >
                {type.id === "saw" ? "o" : "♡"}
              </div>
              <h2 className="mt-4 font-serif text-2xl font-semibold">
                {type.title}
              </h2>
              <p className="mx-auto mt-2 max-w-[220px] text-sm leading-5 text-white/80">
                {type.body}
              </p>
            </button>
          );
        })}
      </section>

      {activeType && (
        <section className="rounded-lg border border-dusk/10 bg-white/65 p-4 shadow-soft">
          <label className="text-sm font-semibold text-dusk/70">
            What would you like to remember?
          </label>
          <textarea
            className="mt-3 min-h-28 w-full resize-none rounded-lg border border-dusk/10 bg-linen px-3 py-3 text-sm leading-5 text-dusk placeholder:text-dusk/35"
            onChange={(event) => {
              setNote(event.target.value);
              setError("");
            }}
            placeholder="A sentence or two is enough."
            value={note}
          />
          {error && <p className="mt-2 text-xs text-clay">{error}</p>}
          <button
            className="mt-3 w-full rounded-lg bg-dusk px-4 py-3 text-sm font-semibold text-linen"
            onClick={saveMoment}
            type="button"
          >
            Save Moment
          </button>
        </section>
      )}

      <section className="space-y-3 border-t border-dusk/10 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold">Recent Moments</h2>
          <span className="text-xs font-medium text-moss">See all</span>
        </div>
        {unpromptedMoments.slice(0, 3).map((moment) => (
          <MomentPreview
            key={moment.id}
            moment={moment}
            onTogglePreserved={() => onToggleUnpromptedPreserved(moment.id)}
          />
        ))}
      </section>
    </div>
  );
}
