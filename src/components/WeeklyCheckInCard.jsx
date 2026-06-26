import { useState } from "react";
import { weeklyReflection } from "../data/mockData.js";
import AiReflectionCard from "./AiReflectionCard.jsx";

export default function WeeklyCheckInCard() {
  const [reflections, setReflections] = useState({
    marcus: weeklyReflection.marcus,
    jordan: weeklyReflection.jordan,
  });

  function updateReflection(partner, value) {
    setReflections((current) => ({ ...current, [partner]: value }));
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-dusk/10 bg-white/65 p-4 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-normal text-clay">
          Weekly reflection
        </p>
        <h2 className="mt-2 font-serif text-[22px] font-semibold leading-7 tracking-normal">
          Is there anything you remember about affirming relational progress in
          the past week that you'd like to capture?
        </h2>

        <div className="mt-5 grid gap-4">
          {Object.entries(reflections).map(([partner, value]) => (
            <label className="block" key={partner}>
              <span className="text-sm font-semibold capitalize text-dusk/70">
                {partner}
              </span>
              <textarea
                className="mt-2 min-h-32 w-full resize-none rounded-lg border border-dusk/10 bg-linen px-3 py-3 text-sm leading-6 text-dusk"
                onChange={(event) =>
                  updateReflection(partner, event.target.value)
                }
                value={value}
              />
            </label>
          ))}
        </div>
      </div>

      <AiReflectionCard />
    </section>
  );
}
