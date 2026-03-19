import React from "react";

interface SegmentedControlOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  selected: string;
  onChange: (value: string) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selected,
  onChange,
}) => {
  return (
    <div className="inline-flex rounded-full p-1 gap-1 soft-shadow" style={{ background: 'var(--color-accent-light)' }}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium smooth-transition ${
              isSelected
                ? "text-white soft-shadow"
                : ""
            }`}
            style={{
              background: isSelected ? 'var(--color-primary)' : 'transparent',
              color: isSelected ? 'white' : 'var(--color-text-muted)',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
