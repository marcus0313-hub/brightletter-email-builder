export default function MomentumCard({ couple }) {
  return (
    <section className="scenic-hero rounded-lg shadow-soft">
      <div className="relative z-10 flex min-h-[218px] flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-medium text-dusk/70">
              Good morning,
            </p>
            <h1 className="font-serif text-[26px] font-semibold leading-8 text-dusk">
              {couple.names}
            </h1>
          </div>
          <div className="flex -space-x-2">
            <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-linen bg-clay text-sm font-semibold text-white">
              M
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-linen bg-moss text-sm font-semibold text-white">
              J
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 top-[78px] h-14 w-14 -translate-x-1/2 rounded-full sun-disc" />

        <div className="rounded-lg border border-white/70 bg-linen/85 p-4 shadow-soft backdrop-blur">
          <p className="text-xs font-semibold text-clay">En Route to</p>
          <h2 className="font-serif text-[22px] font-semibold leading-7">
            Stronger Partnership
          </h2>
          <p className="mt-3 text-sm leading-5 text-dusk/70">
            You are tending something meaningful together.
          </p>
        </div>
      </div>
    </section>
  );
}
