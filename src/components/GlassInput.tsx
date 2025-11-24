import React from 'react';

interface GlassInputProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
}

export default function GlassInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  required = false,
}: GlassInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`glass-input w-full ${className}`}
      required={required}
    />
  );
}

