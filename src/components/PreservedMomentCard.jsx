export default function PreservedMomentCard({ moment }) {
  return (
    <article className="rounded-lg border border-dusk/10 bg-white/60 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-clay">
            {moment.source} / {moment.time}
          </p>
          <h3 className="mt-2 font-serif text-lg font-semibold tracking-normal">
            {moment.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-dusk/70">{moment.body}</p>
        </div>
        <span
          aria-hidden="true"
          className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blush"
        />
      </div>
    </article>
  );
}
