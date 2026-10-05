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

// Days in month calculation with leap year support
function getMaxDays(month: number, year?: number): number {
  if (month === 2) {
    if (year && year >= 1000) {
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      return isLeap ? 29 : 28;
    }
    return 29; // default max for Feb before year is finalized
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

function clampNumber(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function formatInputString(raw: string) {
  if (!raw.trim()) {
    return { digits: '', formattedBn: '', isoDate: '' };
  }

  const en = bnToEnNumber(raw);

  // Check for pasted ISO date YYYY-MM-DD
  const ymdMatch = en.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    let y = clampNumber(parseInt(ymdMatch[1], 10), 1000, 2100);
    let m = clampNumber(parseInt(ymdMatch[2], 10), 1, 12);
    let d = clampNumber(parseInt(ymdMatch[3], 10), 1, getMaxDays(m, y));
    const dStr = String(d).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    const yStr = String(y).padStart(4, '0');
    return {
      digits: `${dStr}${mStr}${yStr}`,
      formattedBn: enToBnNumber(`${dStr}-${mStr}-${yStr}`),
      isoDate: `${yStr}-${mStr}-${dStr}`,
    };
  }

  // Check for pasted DD-MM-YYYY
  const dmyMatch = en.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    let y = clampNumber(parseInt(dmyMatch[3], 10), 1000, 2100);
    let m = clampNumber(parseInt(dmyMatch[2], 10), 1, 12);
    let d = clampNumber(parseInt(dmyMatch[1], 10), 1, getMaxDays(m, y));
    const dStr = String(d).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    const yStr = String(y).padStart(4, '0');
    return {
      digits: `${dStr}${mStr}${yStr}`,
      formattedBn: enToBnNumber(`${dStr}-${mStr}-${yStr}`),
      isoDate: `${yStr}-${mStr}-${dStr}`,
    };
  }

  let rawDigits = en.replace(/\D/g, '');
  if (!rawDigits) {
    return { digits: '', formattedBn: '', isoDate: '' };
  }

  // 1. Process Day (1 - 31)
  let dStr = '';
  let rest = '';

  if (rawDigits.length === 1) {
    const firstDigit = parseInt(rawDigits[0], 10);
    if (firstDigit >= 4) {
      // 4-9 can only be single-digit days 04-09
      dStr = `0${firstDigit}`;
      rest = rawDigits.slice(1);
    } else {
      return {
        digits: rawDigits,
        formattedBn: enToBnNumber(rawDigits),
        isoDate: '',
      };
    }
  } else {
    let d = parseInt(rawDigits.slice(0, 2), 10);
    d = clampNumber(d, 1, 31);
    dStr = String(d).padStart(2, '0');
    rest = rawDigits.slice(2);
  }

  // If no more digits, return day with trailing hyphen
  if (!rest) {
    return {
      digits: dStr,
      formattedBn: enToBnNumber(`${dStr}-`),
      isoDate: '',
    };
  }

  // 2. Process Month (1 - 12)
  let mStr = '';
  let yearDigits = '';

  if (rest.length === 1) {
    const firstMDigit = parseInt(rest[0], 10);
    if (firstMDigit >= 2) {
      // 2-9 can only be single-digit months 02-09
      mStr = `0${firstMDigit}`;
      yearDigits = rest.slice(1);
    } else {
      return {
        digits: `${dStr}${rest}`,
        formattedBn: enToBnNumber(`${dStr}-${rest}`),
        isoDate: '',
      };
    }
  } else {
    let m = parseInt(rest.slice(0, 2), 10);
    m = clampNumber(m, 1, 12);
    mStr = String(m).padStart(2, '0');
    yearDigits = rest.slice(2);
  }

  // Validate day against maximum days in this month
  let dNum = parseInt(dStr, 10);
  const mNum = parseInt(mStr, 10);
  const maxD = getMaxDays(mNum);
  if (dNum > maxD) {
    dNum = maxD;
    dStr = String(dNum).padStart(2, '0');
  }

  // If no year digits yet, return dd-mm with trailing hyphen
  if (!yearDigits) {
    return {
      digits: `${dStr}${mStr}`,
      formattedBn: enToBnNumber(`${dStr}-${mStr}-`),
      isoDate: '',
    };
  }

  // 3. Process Year (1000 - 2100, max 4 digits)
  if (yearDigits.startsWith('0')) {
    yearDigits = yearDigits.replace(/^0+/, '');
    if (!yearDigits) {
      return {
        digits: `${dStr}${mStr}`,
        formattedBn: enToBnNumber(`${dStr}-${mStr}-`),
        isoDate: '',
      };
    }
  }

  yearDigits = yearDigits.slice(0, 4);

  if (yearDigits.length < 4) {
    return {
      digits: `${dStr}${mStr}${yearDigits}`,
      formattedBn: enToBnNumber(`${dStr}-${mStr}-${yearDigits}`),
      isoDate: '',
    };
  }

  // Exactly 4 digits for year
  let y = parseInt(yearDigits, 10);
  y = clampNumber(y, 1000, 2100);
  const yStr = String(y).padStart(4, '0');

  // Re-check February days for leap year
  const finalMaxD = getMaxDays(mNum, y);
  if (dNum > finalMaxD) {
    dNum = finalMaxD;
    dStr = String(dNum).padStart(2, '0');
  }

  return {
    digits: `${dStr}${mStr}${yStr}`,
    formattedBn: enToBnNumber(`${dStr}-${mStr}-${yStr}`),
    isoDate: `${yStr}-${mStr}-${dStr}`,
  };
}

export function BanglaDateInput({
  value,
  onChange,
  className = 'form-input',
  style,
  placeholder = 'দিন-মাস-বছর (যেমন: ০৪-১০-২০২৬)',
}: BanglaDateInputProps) {
  const hiddenDateRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!rawVal.trim()) {
      setText('');
      onChange('');
      return;
    }

    const res = formatInputString(rawVal);
    setText(res.formattedBn);

    if (res.isoDate) {
      onChange(res.isoDate);
    } else if (res.digits.length === 0) {
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
          const res = formatInputString(newText);
          setText(res.formattedBn);

          if (res.isoDate) {
            onChange(res.isoDate);
          } else if (res.digits.length === 0) {
            onChange('');
          }

          const targetPos = Math.max(0, selStart - 2);
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(targetPos, targetPos);
            }
          }, 0);
        }
      }
    }
  };

  const handleBlur = () => {
    const res = formatInputString(text);
    if (res.isoDate) {
      onChange(res.isoDate);
      setText(res.formattedBn);
    } else {
      // Revert incomplete typing to previous valid value
      setText(toDisplay(value));
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      <input
        ref={inputRef}
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
