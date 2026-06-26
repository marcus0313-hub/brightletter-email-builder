import KeepMomentButton from "./KeepMomentButton.jsx";

const typeCopy = {
  saw: "Seen",
  felt: "Felt",
};

export default function MomentPreview({ moment, onTogglePreserved }) {
  return (
    <article className="rounded-lg border border-dusk/10 bg-linen/75 p-3">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white ${
            moment.type === "saw" ? "bg-moss" : "bg-clay"
          }`}
        >
          {moment.type === "saw" ? "S" : "F"}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-clay">
            {typeCopy[moment.type]} / {moment.time}
          </p>
          <p className="mt-1 text-sm leading-6 text-dusk/75">{moment.note}</p>
        </div>
      </div>
      <div className="mt-3">
        <KeepMomentButton
          isKept={moment.preserved}
          onToggle={onTogglePreserved}
        />
      </div>
    </article>
  );
}
