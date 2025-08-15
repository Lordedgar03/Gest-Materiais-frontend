// src/components/AutoCompleteInput.jsx
import React, { useState, useEffect } from 'react';

function AutoCompleteInput({ options, value, onChange }) {
  const [filtered, setFiltered] = useState([]);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (value) {
      const lower = value.toLowerCase();
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(lower)
      );
      setFiltered(filtered);
      setShowOptions(true);
    } else {
      setFiltered([]);
      setShowOptions(false);
    }
  }, [value, options]);

  const handleSelect = (item) => {
    onChange(item.value);
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="pesquisar..." 
        className="border rounded p-2 w-full"
        onFocus={() => value && setShowOptions(true)}
        onBlur={() => setTimeout(() => setShowOptions(false), 200)}
      />
      {showOptions && filtered.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full rounded shadow max-h-48 overflow-y-auto">
          {filtered.map((item) => (
            <li
              key={item.value}
              onClick={() => handleSelect(item)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AutoCompleteInput;