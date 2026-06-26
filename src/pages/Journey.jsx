import PreservedMomentCard from "../components/PreservedMomentCard.jsx";
import { preservedMoments } from "../data/mockData.js";

export default function Journey({ preservedCount }) {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-dusk/10 bg-white/65 p-5 shadow-soft">
        <p className="text-sm font-semibold text-clay">Journey</p>
        <h2 className="mt-2 font-serif text-[28px] font-semibold leading-8 tracking-normal">
          Meaningful memory anchors
        </h2>
        <p className="mt-3 text-sm leading-6 text-dusk/70">
          En Route keeps a rolling 4-week window visible by default. When a
          moment feels worth returning to, Keep This Moment gives it a softer
          place to stay.
        </p>
        <p className="mt-4 rounded-lg bg-sage/60 px-3 py-2 text-sm font-medium text-dusk/70">
          {preservedCount} moments currently kept from recent acknowledgments.
        </p>
      </section>

      <section className="rounded-lg border border-clay/15 bg-blush/25 p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-normal text-clay">
          Photo memory
        </p>
        <h3 className="mt-2 font-serif text-xl font-semibold tracking-normal">
          Find a photo that reminds you of a time you felt especially connected.
        </h3>
        <p className="mt-2 text-sm leading-6 text-dusk/70">
          Older and fonder memories can help the current season feel held by the
          whole story, not only this week.
        </p>
        <button
          className="mt-4 rounded-lg bg-linen px-4 py-2 text-sm font-semibold text-dusk shadow-soft"
          type="button"
        >
          Add Memory Later
        </button>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-clay">Preserved Moments</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold tracking-normal">
            Places to return
          </h2>
        </div>
        {preservedMoments.map((moment) => (
          <PreservedMomentCard key={moment.id} moment={moment} />
        ))}
      </section>
    </div>
  );
}
