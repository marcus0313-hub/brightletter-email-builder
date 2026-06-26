import { upcomingSharedEvents } from "../data/mockData.js";

export default function Calendar() {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-dusk/10 bg-white/65 p-5 shadow-soft">
        <p className="text-sm font-semibold text-clay">Shared rhythm</p>
        <h1 className="mt-2 font-serif text-[28px] font-semibold leading-8 tracking-normal">
          Our time together.
        </h1>
        <p className="mt-3 text-sm leading-6 text-dusk/70">
          A gentle read-only view of the time you share.
        </p>
      </section>

      <section className="rounded-lg border border-moss/20 bg-sage/55 p-4 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-serif text-lg font-semibold">Google Calendar</p>
            <p className="mt-1 text-sm text-dusk/70">
              Read-only connection planned
            </p>
          </div>
          <span
            aria-hidden="true"
            className="grid h-11 w-11 place-items-center rounded-full bg-linen text-sm font-semibold text-moss"
          >
            Cal
          </span>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-clay">
            Upcoming time together
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold">
            Read-only calendar view
          </h2>
        </div>

        <div className="space-y-3">
          {upcomingSharedEvents.map((event) => (
            <article
              className="rounded-lg border border-dusk/10 bg-white/60 p-4 shadow-soft"
              key={event.id}
            >
              <p className="text-xs font-semibold uppercase tracking-normal text-dusk/45">
                {event.day} / {event.time}
              </p>
              <h3 className="mt-2 font-serif text-lg font-semibold text-dusk">
                {event.title}
              </h3>
            </article>
          ))}
        </div>
      </section>

      {/* Future Google Calendar integration:
          - Use Google OAuth.
          - Request the least permissive read-only scope, such as calendar.events.readonly when it supports the shared-calendar use case.
          - Read events with GET /calendar/v3/calendars/{calendarId}/events.
          - Keep this view read-only and avoid storing calendar data until a backend privacy model exists. */}
    </div>
  );
}
