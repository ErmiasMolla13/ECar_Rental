'use client'
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function AboutPage() {
  const [showDrawer, setShowDrawer] = useState(false);

  const toggleDrawer = () => {
    setShowDrawer(!showDrawer);
  };

  

  return (
    <>
      <Head>
        <title>About Us - ER-Car Rental</title>
        <meta name="description" content="Learn about ER-Car Rental" />
      </Head>

      <div className="min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold"> About ER-Car Rental</Link>
            <Link href="/">Back</Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Welcome to ER-Car Rental</h1>
          <p className="text-lg mb-8">
            Your trusted partner for car rentals. Explore our wide selection of vehicles.
          </p>
          
          {/* Other page content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-3">Economy Cars</h2>
              <p>Affordable and fuel-efficient options for your travels.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-3">Luxury Vehicles</h2>
              <p>Premium cars for special occasions and business trips.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-3">SUVs & Vans</h2>
              <p>Spacious vehicles for families and groups.</p>
            </div>
          </div>
        </main>



        {/* Overlay when drawer is open */}
        {showDrawer && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleDrawer}
          />
        )}
      </div>
    </>
  );
}