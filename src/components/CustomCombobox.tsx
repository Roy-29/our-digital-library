'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomCombobox({ options, value, onChange, placeholder, className = '', disabled = false }: CustomComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Filter options based on input value
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes((value || '').toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`custom-select-container`} ref={containerRef} style={{ position: 'relative', width: '100%', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          className={`form-input ${className}`}
          style={{ paddingRight: '32px' }}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
        />
        <ChevronDown 
          size={16} 
          style={{ 
            position: 'absolute', 
            right: '12px', 
            color: 'var(--accent)', 
            transition: 'transform 0.2s', 
            transform: isOpen ? 'rotate(180deg)' : 'none',
            pointerEvents: 'none'
          }} 
        />
      </div>
      
      {isOpen && !disabled && filteredOptions.length > 0 && (
        <div className="custom-select-dropdown">
          {filteredOptions.map((opt, i) => (
            <div 
              key={`${opt}-${i}`}
              className={`custom-select-option ${opt === value ? 'selected' : ''}`}
              onMouseDown={(e) => {
                // Prevent input from losing focus before onClick fires
                e.preventDefault();
              }}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
