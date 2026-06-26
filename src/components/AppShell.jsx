import BottomNav from "./BottomNav.jsx";

const titles = {
  acknowledge: "Acknowledge",
  calendar: "Calendar",
  checkin: "Check-In",
  home: "",
  journey: "Journey",
};

export default function AppShell({
  activePage,
  children,
  couple,
  onNavigate,
  preservedCount,
}) {
  return (
    <div className="min-h-screen bg-app-wallpaper px-0 py-0 text-dusk sm:flex sm:items-center sm:justify-center sm:px-6 sm:py-6">
      <div className="phone-shell relative mx-auto flex h-screen w-full max-w-[390px] flex-col overflow-hidden bg-linen shadow-phone sm:h-[844px] sm:rounded-[32px] sm:border sm:border-white/70">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-7 bg-linen/75 backdrop-blur" />
        <header className="relative z-40 px-5 pb-2 pt-3">
          <div className="flex h-5 items-center justify-between text-[13px] font-semibold text-dusk">
            <span>9:41</span>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-3 rounded-sm border border-dusk/80" />
              <span className="h-2 w-2 rounded-full bg-dusk/80" />
              <span className="h-2.5 w-5 rounded-[3px] border border-dusk/80">
                <span className="block h-full w-3.5 rounded-[2px] bg-dusk/80" />
              </span>
            </div>
          </div>

          {activePage !== "home" && (
            <div className="mt-6 grid grid-cols-[32px_1fr_32px] items-center">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-2xl leading-none text-dusk/80"
                onClick={() => onNavigate("home")}
                type="button"
              >
                <span aria-hidden="true">‹</span>
                <span className="sr-only">Back home</span>
              </button>
              <div className="text-center">
                <p className="font-serif text-xl font-semibold">
                  {titles[activePage]}
                </p>
                {activePage === "acknowledge" && (
                  <p className="mt-1 text-xs text-dusk/60">
                    Make effort visible.
                  </p>
                )}
              </div>
              <div />
            </div>
          )}
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-28 pt-2">
          {children}
        </main>
        <BottomNav activePage={activePage} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
