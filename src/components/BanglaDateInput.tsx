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

  const formatDigits = (raw: string) => {
    const en = bnToEnNumber(raw);
    
    // Check if user pasted YYYY-MM-DD
    const ymdMatch = en.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    let digits = '';
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = ymdMatch[2].padStart(2, '0');
      const d = ymdMatch[3].padStart(2, '0');
      digits = `${d}${m}${y}`;
    } else {
      digits = en.replace(/\D/g, '').slice(0, 8);
    }

    let formatted = '';
    if (digits.length > 0) {
      formatted += digits.slice(0, 2);
    }
    if (digits.length >= 2) {
      formatted += '-';
    }
    if (digits.length > 2) {
      formatted += digits.slice(2, 4);
    }
    if (digits.length >= 4) {
      formatted += '-';
    }
    if (digits.length > 4) {
      formatted += digits.slice(4, 8);
    }

    return {
      digits,
      formattedBn: enToBnNumber(formatted),
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (!rawVal.trim()) {
      setText('');
      onChange('');
      return;
    }

    const { digits, formattedBn } = formatDigits(rawVal);
    setText(formattedBn);

    if (digits.length === 8) {
      const d = digits.slice(0, 2);
      const m = digits.slice(2, 4);
      const y = digits.slice(4, 8);
      const dayNum = parseInt(d, 10);
      const monthNum = parseInt(m, 10);
      const yearNum = parseInt(y, 10);
      if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31 && yearNum >= 1000) {
        onChange(`${y}-${m}-${d}`);
      }
    } else if (digits.length === 0) {
      onChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const input = e.currentTarget;
      const selStart = input.selectionStart;
      const selEnd = input.selectionEnd;

      if (selStart !== null && selStart === selEnd && selStart > 0) {
        const charBefore = text[selStart - 1];
        if (charBefore === '-') {
          e.preventDefault();
          // Remove the hyphen AND the character preceding it
          const newText = text.slice(0, selStart - 2) + text.slice(selStart);
          const { digits, formattedBn } = formatDigits(newText);
          setText(formattedBn);

          if (digits.length === 8) {
            const d = digits.slice(0, 2);
            const m = digits.slice(2, 4);
            const y = digits.slice(4, 8);
            onChange(`${y}-${m}-${d}`);
          } else {
            onChange('');
          }
        }
      }
    }
  };

  const handleBlur = () => {
    // Re-format cleanly on blur
    const { digits } = formatDigits(text);
    if (digits.length === 8) {
      const d = digits.slice(0, 2);
      const m = digits.slice(2, 4);
      const y = digits.slice(4, 8);
      const dayNum = parseInt(d, 10);
      const monthNum = parseInt(m, 10);
      const yearNum = parseInt(y, 10);
      if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31 && yearNum >= 1000) {
        onChange(`${y}-${m}-${d}`);
        setText(enToBnNumber(`${d}-${m}-${y}`));
        return;
      }
    }
    // If incomplete or invalid, revert to last valid value
    setText(toDisplay(value));
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      <input
        type="text"
        inputMode="numeric"
        maxLength={10}
        className={`${className} font-serif`}
        value={text}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
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
          const newVal = e.target.value;
          onChange(newVal);
          setText(toDisplay(newVal));
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
