'use client';

import React, { useRef, useState, useEffect } from 'react';
import { enToBnNumber, bnToEnNumber } from '@/lib/types';

interface BanglaDateInputProps {
  value: string | null | undefined; // "YYYY-MM-DD"
  onChange: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

export function BanglaDateInput({
  value,
  onChange,
  className = 'form-input',
  style,
  placeholder = 'দিন-মাস-বছর (যেমন: ০৪-১০-২০২৬)',
}: BanglaDateInputProps) {
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  // Convert YYYY-MM-DD to DD-MM-YYYY in Bengali
  const toDisplay = (val: string | null | undefined) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      return enToBnNumber(`${dd}-${mm}-${yyyy}`);
    }
    return enToBnNumber(val);
  };

  const [text, setText] = useState(toDisplay(value));

  useEffect(() => {
    setText(toDisplay(value));
  }, [value]);

  const openCalendar = () => {
    const el = hiddenDateRef.current;
    if (el) {
      try {
        if (typeof (el as any).showPicker === 'function') {
          (el as any).showPicker();
        } else {
          el.focus();
        }
      } catch {
        el.focus();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setText(rawVal);

    if (!rawVal.trim()) {
      onChange('');
      return;
    }

    // Try to parse dd-mm-yyyy or yyyy-mm-dd
    const enDigits = bnToEnNumber(rawVal).replace(/[^0-9-/.]/g, '');
    const parts = enDigits.split(/[-/.]/);
    if (parts.length === 3) {
      // If user typed dd-mm-yyyy
      if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2];
        onChange(`${y}-${m}-${d}`);
      }
      // If user typed yyyy-mm-dd
      else if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        onChange(`${y}-${m}-${d}`);
      }
    }
  };

  const handleBlur = () => {
    // Re-format cleanly on blur
    setText(toDisplay(value));
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      <input
        type="text"
        className={`${className} font-serif`}
        value={text}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        style={{
          fontFamily: 'var(--font-serif)',
          paddingRight: value ? '58px' : '38px',
          ...style,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setText('');
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              padding: '2px 4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1,
            }}
            title="তারিখ মুছুন"
          >
            ✕
          </button>
        )}
        <button
          type="button"
          onClick={openCalendar}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.15rem',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            lineHeight: 1,
          }}
          title="ক্যালেন্ডার খুলুন"
        >
          📅
        </button>
      </div>

      {/* Hidden native date input to trigger browser calendar */}
      <input
        ref={hiddenDateRef}
        type="date"
        value={value || ''}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        style={{
          position: 'absolute',
          top: '50%',
          right: '10px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          padding: 0,
          margin: 0,
          border: 'none',
        }}
        tabIndex={-1}
      />
    </div>
  );
}
