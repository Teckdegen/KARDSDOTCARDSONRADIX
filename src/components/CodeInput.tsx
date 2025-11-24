'use client';

import { useState, useRef, useEffect } from 'react';

interface CodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  value?: string;
  onChange?: (code: string) => void;
}

export default function CodeInput({ length = 6, onComplete, value = '', onChange }: CodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (value) {
      const codeArray = value.split('').slice(0, length);
      const newCode = [...Array(length).fill('')];
      codeArray.forEach((char, index) => {
        newCode[index] = char;
      });
      setCode(newCode);
    }
  }, [value, length]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = char.slice(-1); // Only take last character
    setCode(newCode);

    if (onChange) {
      onChange(newCode.join(''));
    }

    // Auto-focus next input
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newCode.every(c => c !== '') && newCode.join('').length === length) {
      onComplete(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    
    if (pastedData.length > 0) {
      const newCode = [...Array(length).fill('')];
      pastedData.split('').forEach((char, index) => {
        if (index < length) {
          newCode[index] = char;
        }
      });
      setCode(newCode);

      if (onChange) {
        onChange(newCode.join(''));
      }

      // Focus last filled input or first empty
      const lastFilledIndex = Math.min(pastedData.length - 1, length - 1);
      inputRefs.current[lastFilledIndex]?.focus();

      // Check if complete
      if (newCode.every(c => c !== '') && newCode.join('').length === length) {
        onComplete(newCode.join(''));
      }
    }
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={code[index]}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="code-input-box"
          style={{ caretColor: '#F5F5DC' }}
        />
      ))}
    </div>
  );
}

