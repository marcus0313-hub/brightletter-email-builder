import { useState } from "react";
import ReflectionModal from "../components/ReflectionModal.jsx";
import WeeklyCheckInCard from "../components/WeeklyCheckInCard.jsx";

export default function CheckIn() {
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-dusk/10 bg-white/65 p-5 shadow-soft">
        <p className="text-sm font-semibold text-clay">Check-In</p>
        <h2 className="mt-1 font-serif text-[28px] font-semibold leading-8 tracking-normal">
          A weekly return
        </h2>
        <p className="mt-3 text-sm leading-6 text-dusk/70">
          A quiet place to gather what felt meaningful this week.
        </p>
        <button
          className="mt-4 w-full rounded-lg bg-dusk px-4 py-3 text-sm font-semibold text-linen"
          onClick={() => setIsReflectionOpen(true)}
          type="button"
        >
          Open weekly reflection
        </button>
      </section>

      {isReflectionOpen && (
        <ReflectionModal onClose={() => setIsReflectionOpen(false)}>
          <WeeklyCheckInCard />
        </ReflectionModal>
      )}
    </div>
  );
}
