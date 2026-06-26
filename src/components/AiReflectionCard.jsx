import { useState } from "react";
import { weeklyReflection } from "../data/mockData.js";

export default function AiReflectionCard({ compact = false }) {
  const [showSuggestion, setShowSuggestion] = useState(false);

  return (
    <section className="rounded-lg border border-dusk/10 bg-white/65 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-normal text-dusk/50">
          Gentle AI reflection
        </p>
        <span className="text-xl leading-none text-clay" aria-hidden="true">
          +
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-dusk/75">
        {weeklyReflection.aiSummary}
      </p>

      {/* Future AI integration: summarize first, then offer help only when invited. */}
      {!compact && (
        <div className="mt-4">
          <button
            className="rounded-lg bg-dusk px-4 py-2 text-sm font-semibold text-linen"
            onClick={() => setShowSuggestion((current) => !current)}
            type="button"
          >
            {showSuggestion ? "Hide Gentle Focus" : "Help Choose a Gentle Focus"}
          </button>

          {showSuggestion && (
            <p className="mt-3 rounded-lg bg-linen p-3 text-sm leading-6 text-dusk/70">
              A gentle focus for next week could be: name one small repair when
              it happens, then let the rest of the conversation breathe.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
