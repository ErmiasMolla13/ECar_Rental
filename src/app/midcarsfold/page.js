'use client'

import { useState } from 'react';
import MidCars from '../components/midcars';
import { Mid } from '../../data/midcar.js';
import Link from 'next/link';
import { Drawer, Button } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import FilterSidebar from '../components/MiddelClassFilter';

export default function CarsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [filteredCars, setFilteredCars] = useState(Mid);
  const carsPerPage = 8;
  
  // Calculate pagination based on filtered cars
  const indexOfLastCar = currentPage * carsPerPage;
  const indexOfFirstCar = indexOfLastCar - carsPerPage;
  const currentCars = filteredCars.slice(indexOfFirstCar, indexOfLastCar);
  const totalPages = Math.ceil(filteredCars.length / carsPerPage);

  const showFilterDrawer = () => {
    setFilterDrawerVisible(true);
  };

  const closeFilterDrawer = () => {
    setFilterDrawerVisible(false);
  };

  const handleFilter = (filtered) => {
    setFilteredCars(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleReset = () => {
    setFilteredCars(Mid);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Filter Button */}
      <div className="md:hidden p-4">
        <Button 
          type="primary" 
          icon={<FilterOutlined />}
          onClick={showFilterDrawer}
          className="w-full"
        >
          Filters
        </Button>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block md:w-1/4 lg:w-1/5 bg-white border-r border-gray-200">
          <FilterSidebar 
            Mid={Mid} 
            onFilter={handleFilter}
            onReset={handleReset}
          />
        </div>

        {/* Mobile Drawer */}
        <Drawer
          title="Filters"
          placement="left"
          width={300}
          onClose={closeFilterDrawer}
          open={filterDrawerVisible}
        >
          <FilterSidebar 
            Mid={Mid} 
            onFilter={handleFilter}
            onReset={handleReset}
          />
        </Drawer>

        {/* Main Content */}
        <div className="w-full md:w-3/4 lg:w-4/5 p-4">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Middel Class Cars ({filteredCars.length})
              </h1>
              <Link 
                href="/" passHref
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                ← Back to Home
              </Link>
            </div>

            {/* Cars Grid */}
            {filteredCars.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentCars.map((car) => (
                    <MidCars key={car.id} car={car} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex justify-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => setCurrentPage(number)}
                      className={`px-4 py-2 rounded-md ${currentPage === number ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>

                {/* Page Info */}
                <div className="mt-4 text-center text-gray-600">
                  Showing cars {indexOfFirstCar + 1}-{Math.min(indexOfLastCar, filteredCars.length)} of {filteredCars.length}
                </div>
              </>
            ) : (
              <div className="text-center py-10 bg-white rounded-lg shadow">
                <h3 className="text-xl font-bold mb-2">No cars match your filters</h3>
                <p className="text-gray-600">Try adjusting your filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}