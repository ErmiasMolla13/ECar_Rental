'use client';

import Link from 'next/link';

export default function VipCar({ car }) {
  if (!car) return null;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-200">
      <div className="relative">
        <img
          src={car.image}
          alt={`${car.make} ${car.model}`}
          className="h-48 w-full object-cover"
        />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-gray-800">
            {car.make} {car.model}
          </h3>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
            {car.year}
          </span>
        </div>

        <p className="mt-2 text-sm text-gray-600">{car.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">${car.price}/day</span>
          <Link
            href={`/vipcars/${car.id}`}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
