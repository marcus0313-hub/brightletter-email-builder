import MomentumCard from "../components/MomentumCard.jsx";
import UnpromptedMomentCard from "../components/UnpromptedMomentCard.jsx";
import WeeklyFocusCard from "../components/WeeklyFocusCard.jsx";

export default function Home({
  couple,
  focuses,
  onAddFocusAcknowledgment,
  onAddUnpromptedMoment,
  onToggleFocusPreserved,
  onToggleUnpromptedPreserved,
  unpromptedMoments,
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-1">
        <button
          className="grid h-9 w-9 place-items-center rounded-full text-2xl leading-none text-dusk/75"
          type="button"
        >
          <span aria-hidden="true">≡</span>
          <span className="sr-only">Open menu</span>
        </button>
        <p className="font-serif text-xl font-semibold">En Route</p>
        <button
          className="grid h-9 w-9 place-items-center rounded-full text-xl text-dusk/70"
          type="button"
        >
          <span aria-hidden="true">○</span>
          <span className="sr-only">Open notices</span>
        </button>
      </div>

      <MomentumCard couple={couple} />

      <div className="rounded-lg border border-dusk/10 bg-white/60 px-4 py-3 text-sm leading-5 text-dusk/70 shadow-soft">
        Take a second to notice something meaningful today.
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-clay">This week</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold tracking-normal">
              Tending the shared rhythm
            </h2>
          </div>
          <span className="text-xs font-medium text-moss">View all</span>
        </div>

        {focuses.map((focus) => (
          <WeeklyFocusCard
            focus={focus}
            key={focus.id}
            onAddAcknowledgment={(type, note) =>
              onAddFocusAcknowledgment(focus.id, type, note)
            }
            onTogglePreserved={(momentId) =>
              onToggleFocusPreserved(focus.id, momentId)
            }
          />
        ))}
      </section>

      <UnpromptedMomentCard
        moments={unpromptedMoments}
        onAddMoment={onAddUnpromptedMoment}
        onTogglePreserved={onToggleUnpromptedPreserved}
      />
    </div>
  );
}
