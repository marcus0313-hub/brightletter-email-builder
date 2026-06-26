import AcknowledgmentComposer from "./AcknowledgmentComposer.jsx";
import MomentPreview from "./MomentPreview.jsx";

export default function UnpromptedMomentCard({
  moments,
  onAddMoment,
  onTogglePreserved,
}) {
  return (
    <section className="rounded-lg border border-clay/15 bg-blush/25 p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-normal text-clay">
        Unprompted moments
      </p>
      <h3 className="mt-1 font-serif text-xl font-semibold tracking-normal">
        Some moments matter even when they weren't part of the plan.
      </h3>
      <p className="mt-2 text-sm leading-6 text-dusk/70">
        Capture the ordinary gestures, repairs, and small returns that felt
        meaningful in the moment.
      </p>

      <AcknowledgmentComposer onSave={onAddMoment} />

      <div className="mt-4 space-y-3">
        {moments.map((moment) => (
          <MomentPreview
            key={moment.id}
            moment={moment}
            onTogglePreserved={() => onTogglePreserved(moment.id)}
          />
        ))}
      </div>
    </section>
  );
}
