import React from 'react';

export interface UnderstandingPickerProps {
  onSelect: (understanding: 'weak' | 'okay' | 'strong') => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const UnderstandingPicker: React.FC<UnderstandingPickerProps> = ({
  onSelect,
  className = '',
  size = 'sm',
}) => {
  const isSm = size === 'sm';

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect('weak');
        }}
        className={`${
          isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        } rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium transition-colors cursor-pointer`}
        title="Complete with Weak understanding"
      >
        Weak
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect('okay');
        }}
        className={`${
          isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        } rounded-md bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-500/50 font-semibold ring-1 ring-blue-500/40 transition-colors cursor-pointer`}
        title="Complete with Okay understanding (Default)"
      >
        Okay
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect('strong');
        }}
        className={`${
          isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        } rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium transition-colors cursor-pointer`}
        title="Complete with Strong understanding"
      >
        Strong
      </button>
    </div>
  );
};
