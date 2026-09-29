'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AcademicOption } from '@/lib/academic/taxonomy';

type Props = {
  label: string;
  placeholder: string;
  value: string;
  options: AcademicOption[];
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
};

export function AcademicCombobox({ label, placeholder, value, options, disabled, error, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.id === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = options.filter((option) => [option.name, option.shortName, ...(option.aliases || [])].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery));

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    setHighlighted(0);
    setQuery('');
  }, [value, options.length]);

  function select(option: AcademicOption) {
    onChange(option.id);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={`${label.replace(/\W+/g, '-').toLowerCase()}-options`}
          aria-autocomplete="list"
          disabled={disabled}
          value={open ? query : selected?.name || ''}
          placeholder={disabled ? 'Select the previous field first' : placeholder}
          onFocus={() => { if (!disabled) setOpen(true); }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={(event) => {
            if (!open && event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); return; }
            if (event.key === 'ArrowDown') { event.preventDefault(); setHighlighted((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0))); }
            if (event.key === 'ArrowUp') { event.preventDefault(); setHighlighted((index) => Math.max(index - 1, 0)); }
            if (event.key === 'Enter' && filtered[highlighted]) { event.preventDefault(); select(filtered[highlighted]); }
            if (event.key === 'Escape') { setOpen(false); setQuery(''); }
          }}
          className={cn('h-10 w-full rounded-lg border bg-white px-9 pr-16 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-50', error ? 'border-red-400' : 'border-slate-300')}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value && !disabled && <button type="button" aria-label={`Clear ${label}`} onClick={() => onChange('')} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>}
          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
        </div>
      </div>
      {open && !disabled && (
        <div id={`${label.replace(/\W+/g, '-').toLowerCase()}-options`} role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {filtered.length ? filtered.map((option, index) => (
            <button type="button" role="option" aria-selected={option.id === value} key={option.id} onMouseDown={(event) => event.preventDefault()} onClick={() => select(option)} className={cn('flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left text-sm', index === highlighted ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50')}>
              <span><span className="block font-medium">{option.name}</span>{option.shortName && <span className="text-xs text-slate-500">{option.shortName}</span>}</span>
              {option.id === value && <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
            </button>
          )) : <p className="px-3 py-3 text-xs text-slate-500">No matching options. Choose Other / Not listed.</p>}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
