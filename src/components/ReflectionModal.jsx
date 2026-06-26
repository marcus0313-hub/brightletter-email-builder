export default function ReflectionModal({ children, onClose }) {
  return (
    <div
      aria-modal="true"
      className="absolute inset-0 z-50 flex items-end bg-dusk/40 px-4 pb-4 pt-14 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <section
        className="max-h-[78vh] w-full overflow-y-auto rounded-lg border border-white/70 bg-linen p-4 shadow-phone"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-clay">
              Weekly reflection
            </p>
            <h2 className="font-serif text-xl font-semibold">
              A weekly return
            </h2>
          </div>
          <button
            aria-label="Close reflection"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/70 text-lg font-semibold text-dusk/70"
            onClick={onClose}
            type="button"
          >
            X
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
