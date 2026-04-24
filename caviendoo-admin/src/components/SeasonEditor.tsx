const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  value:    number[];
  onChange: (value: number[]) => void;
}

export default function SeasonEditor({ value, onChange }: Props) {
  function toggle(month: number) {
    if (value.includes(month)) {
      onChange(value.filter((m) => m !== month));
    } else {
      onChange([...value, month].sort((a, b) => a - b));
    }
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {MONTHS.map((label, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => toggle(idx)}
          className={`
            w-9 h-7 rounded text-xs font-medium transition-colors
            ${value.includes(idx)
              ? 'bg-gold/80 text-ink'
              : 'bg-white/5 text-cream/40 hover:bg-white/10'}
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
