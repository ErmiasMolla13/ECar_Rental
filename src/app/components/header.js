'use client'
import Link from 'next/link'
import {App as AntdApp, Image} from 'antd';
import { useState, useRef, useEffect } from 'react';
import LogInAs from './LogInAs';
import AccountStatus from './AccountStatus';


export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-blue-600 text-neutral-300 sticky top-0 z-50 shadow-xl">
      <div className="container mx-auto px-4 py-2 h-16 flex items-center justify-between border-b border-blue-500">
        <div className="flex items-center space-x-2">
          <img
            src="/logo.png"
            alt="Er-Car Logo"
            className="h-30 w-auto" />
          <h1 className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-mono font-bold">
            <span className="text-blue-200">Er</span>-Car Rentals
          </h1>
        </div>

        <label htmlFor="mobile-menu-toggle" className="md:hidden text-2xl cursor-pointer">
          ☰
        </label>
      </div>

      <input type="checkbox" id="mobile-menu-toggle" className="hidden peer" />

      <div className="bg-blue-600 hidden peer-checked:block md:block">
        {/* Navigation Links */}
        <nav className="container mx-auto px-4 py-2 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 border-b border-blue-500">
          <Link href="/" className="hover:text-white text-base md:text-lg font-semibold py-1">Home</Link>
          
          {/* Cars Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="hover:text-white text-base md:text-lg font-semibold py-1 flex items-center gap-1"
            >
              Our Cars
              <svg 
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu - Only shows when isDropdownOpen is true */}
            {isDropdownOpen && (
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <Link 
                    href="/EconomicCar" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:obg-blue-50"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                  Cars
                  </Link>
                 
                </div>
              </div>
            )}
          </div>
          <Link href="/components" className="hover:text-white text-base md:text-lg font-semibold py-1">About Us</Link>
        </nav>

        {/* Search and Sign In */}
        <div className="container mx-auto px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-end gap-3">
         
          <div className="py-1 flex items-center gap-4">
            <AccountStatus />
            <LogInAs className="text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}