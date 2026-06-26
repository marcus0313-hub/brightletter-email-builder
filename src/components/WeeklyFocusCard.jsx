import AcknowledgmentComposer from "./AcknowledgmentComposer.jsx";
import MomentPreview from "./MomentPreview.jsx";

const toneClasses = {
  sage: "bg-sage/70",
  butter: "bg-butter/65",
  tide: "bg-tide/30",
};

export default function WeeklyFocusCard({
  focus,
  onAddAcknowledgment,
  onTogglePreserved,
}) {
  return (
    <section className="rounded-lg border border-dusk/10 bg-white/60 p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className={`mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full ${toneClasses[focus.tone]}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-normal text-dusk/50">
            Weekly focus
          </p>
          <h3 className="mt-1 font-serif text-lg font-semibold tracking-normal">
            {focus.title}
          </h3>
          <p className="mt-2 text-sm leading-5 text-dusk/70">
            {focus.description}
          </p>
          <p className="mt-3 inline-flex rounded-full bg-linen px-3 py-1.5 text-xs font-medium text-dusk/70">
            {focus.rhythm}
          </p>
        </div>
      </div>

      <AcknowledgmentComposer onSave={onAddAcknowledgment} />

      <div className="mt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-normal text-dusk/50">
          Recent acknowledgment
        </p>
        {focus.acknowledgments.length > 0 ? (
          focus.acknowledgments.slice(0, 2).map((moment) => (
            <MomentPreview
              key={moment.id}
              moment={moment}
              onTogglePreserved={() => onTogglePreserved(moment.id)}
            />
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-dusk/15 bg-white/40 p-3 text-sm leading-6 text-dusk/55">
            Nothing has to be forced. This space is ready when something feels
            worth naming.
          </p>
        )}
      </div>
    </section>
  );
}
