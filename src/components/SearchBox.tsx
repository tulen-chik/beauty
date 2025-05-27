'use client'
import React, { useEffect,useRef } from 'react';

const SUGGESTIONS = ['Чаты', 'Чат'];

interface SearchBoxProps {
  query: string;
  setQuery: (v: string) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export default function SearchBox({ query, setQuery, onClose, isMobile }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filtered, setFiltered] = React.useState(SUGGESTIONS);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (query) {
      setFiltered(SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase())));
    } else {
      setFiltered(SUGGESTIONS);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="relative w-full" ref={boxRef}>
      <div className={`flex items-center gap-2 w-full bg-black-02 rounded-t-2xl px-3 sm:px-4 py-2
        ${isMobile ? 'shadow-lg' : ''}`}>
        <svg className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="7" stroke="#8B8B99" strokeWidth="2" />
          <path d="M20 20L17 17" stroke="#8B8B99" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          className={`bg-transparent outline-none text-white w-full placeholder:text-[#8B8B99]
            ${isMobile ? 'text-base' : 'text-lg'}`}
          placeholder="Поиск..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Поиск"
        />
        <button 
          onClick={onClose} 
          className="ml-2 text-[#8B8B99] hover:text-white transition p-1" 
          aria-label="Закрыть поиск"
        >
          <svg className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className={`absolute left-0 top-full w-full bg-black-02 rounded-b-2xl shadow-lg z-50 flex flex-col gap-0 animate-fade-in
        ${isMobile ? 'max-h-[300px] overflow-y-auto' : ''}`}>
        {filtered.length === 0 ? (
          <div className="text-[#8B8B99] px-4 py-3 text-sm sm:text-base">Нет результатов</div>
        ) : (
          filtered.map(s => (
            <button
              key={s}
              className="text-white px-4 py-3 text-left hover:bg-black-04 transition text-sm sm:text-base"
              onClick={() => {
                setQuery(s);
                onClose();
              }}
            >
              {s}
            </button>
          ))
        )}
      </div>
    </div>
  );
} 