const navItems = [
  { id: "home", label: "Home", marker: "⌂" },
  { id: "journey", label: "Journey", marker: "◇" },
  { id: "acknowledge", label: "Add", marker: "+" },
  { id: "calendar", label: "Calendar", marker: "□" },
  { id: "checkin", label: "Reflect", marker: "○" },
];

export default function BottomNav({ activePage, onNavigate }) {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-dusk/10 bg-linen/92 px-3 pb-5 pt-2 backdrop-blur">
      <div className="grid grid-cols-5 items-end gap-1">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const isAction = item.id === "acknowledge";

          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-end rounded-lg px-1 text-[10px] font-medium transition ${
                isActive && !isAction
                  ? "text-clay"
                  : "text-dusk/60 hover:text-dusk"
              }`}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`flex items-center justify-center leading-none ${
                  isAction
                    ? "mb-1 h-12 w-12 rounded-full bg-moss text-3xl font-light text-white shadow-action"
                    : `h-6 w-6 text-xl ${isActive ? "text-clay" : "text-dusk/60"}`
                }`}
              >
                {item.marker}
              </span>
              <span className="mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
