'use client';

import React, { createContext, useContext, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

interface SelectProps {
  onValueChange: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  onValueChange,
  defaultValue = '',
  disabled = false,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onValueChange(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{
      open,
      setOpen,
      value,
      onValueChange: handleValueChange,
      disabled
    }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  className = '',
  children
}) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');

  const { open, setOpen, disabled } = context;

  return (
    <button
      type="button"
      className={clsx(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => !disabled && setOpen(!open)}
      disabled={disabled}
    >
      {children}
      <ChevronDown className={clsx('h-4 w-4 transition-transform', open && 'rotate-180')} />
    </button>
  );
};

interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({
  placeholder = 'Seleziona un\'opzione'
}) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');

  const { value } = context;

  return (
    <span className={clsx(!value && 'text-gray-400')}>
      {value || placeholder}
    </span>
  );
};

interface SelectContentProps {
  children: React.ReactNode;
}

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');

  const { open, setOpen } = context;

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpen(false)}
      />
      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
        {children}
      </div>
    </>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');

  const { onValueChange, value: selectedValue } = context;
  const isSelected = value === selectedValue;

  return (
    <div
      className={clsx(
        'px-3 py-2 text-sm cursor-pointer hover:bg-gray-100',
        isSelected && 'bg-primary-50 text-primary-600'
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </div>
  );
};