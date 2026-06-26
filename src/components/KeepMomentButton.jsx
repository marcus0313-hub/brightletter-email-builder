export default function KeepMomentButton({ isKept, onToggle }) {
  return (
    <button
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        isKept
          ? "border-clay/30 bg-blush/50 text-dusk"
          : "border-dusk/10 bg-linen text-dusk/65 hover:border-clay/30 hover:text-dusk"
      }`}
      onClick={onToggle}
      type="button"
    >
      {isKept ? "Moment Kept" : "Keep This Moment"}
    </button>
  );
}
