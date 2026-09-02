'use client';

import { useState } from 'react';

export default function VipclassFilter({ Vip = [], onFilter, onReset }) {
  const [selectedMake, setSelectedMake] = useState('All');
  const [maxPrice, setMaxPrice] = useState(1000);

  const makes = ['All', ...new Set((Vip || []).map((car) => car.make).filter(Boolean))];

  const applyFilters = () => {
    if (!onFilter) return;

    const filtered = (Vip || []).filter((car) => {
      const makeMatch = selectedMake === 'All' || car.make === selectedMake;
      const priceMatch = Number(car.price) <= Number(maxPrice);
      return makeMatch && priceMatch;
    });

    onFilter(filtered);
  };

  const resetFilters = () => {
    setSelectedMake('All');
    setMaxPrice(1000);
    if (onReset) onReset();
  };

  return (
    <aside className="p-4 bg-white h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Filter Cars</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <select
            value={selectedMake}
            onChange={(e) => setSelectedMake(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Price: ${maxPrice}
          </label>
          <input
            type="range"
            min="100"
            max="1000"
            step="10"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={applyFilters}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Apply
        </button>
        <button
          onClick={resetFilters}
          className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
          Reset
        </button>
      </div>
    </aside>
  );
}
