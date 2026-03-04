interface GenericSelectorProps<T extends string> {
  label: string;
  value: T;
  options: T[];
  onChange: (newValue: T) => void;
  className?: string;
}

const GenericSelector = <T extends string>({
  label,
  value,
  options,
  onChange,
  className = '',
}: GenericSelectorProps<T>) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor=""
        className="text--[10px] font-quantico text-center font-bold text-slate-100 tracking-tighter"
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-cyan-200 text-cyan-900 font-quantico border-slate-700 rounded px-2 py-1 text-sm focus:border-cyan-500 outline-none transition-colors"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default GenericSelector;
