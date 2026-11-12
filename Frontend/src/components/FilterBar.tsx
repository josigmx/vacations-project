import type { VacationFilter } from "../types/Vacation";

const FILTER_BUTTONS: { value: VacationFilter; text: string }[] = [
  { value: "all", text: "All vacations" },
  { value: "liked", text: "♥ My likes" },
  { value: "active", text: "Active now" },
  { value: "upcoming", text: "Not started yet" }
];

interface FilterBarProps {
  filter: VacationFilter;
  showLiked: boolean;                       // the admin has no likes → no "My likes" button
  onChange: (filter: VacationFilter) => void;
}

export default function FilterBar({ filter, showLiked, onChange }: FilterBarProps) {
  const buttons = FILTER_BUTTONS.filter((b) => showLiked || b.value !== "liked");

  return (
    <div className="filter-bar">
      {buttons.map((b) => (
        <button
          key={b.value}
          className={b.value === filter ? "filter-btn active" : "filter-btn"}
          onClick={() => onChange(b.value)}
        >
          {b.text}
        </button>
      ))}
    </div>
  );
}
