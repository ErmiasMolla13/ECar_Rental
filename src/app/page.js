"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Carousel, Button } from "antd";
import {
  CarOutlined,
  CheckOutlined,
  SafetyOutlined,
  CustomerServiceOutlined
} from "@ant-design/icons";
import AdSpace from "./components/AdSpace";

export default function Home() {
  const router = useRouter();
  const [priceRange, setPriceRange] = useState([0, 1000]);

  // Promotional slides content
  const promoSlides = [
    {
      title: "Premium Fleet",
      description: "Discover our luxury vehicle collection",
      image: "/ferrari.jpg",
      color: "from-blue-800 to-blue-600"
    },
    {
      title: "30% Off First Rental",
      description: "Special discount for new customers",
      image: "/minbus.jpg",
      color: "from-amber-600 to-amber-400"
    },
    {
      title: "24/7 Roadside Assistance",
      description: "We've got you covered anywhere, anytime",
      image: "/minvan1.jpg",
      color: "from-green-700 to-green-500"
    }
  ];

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Promotional Carousel*/}
      <div className="w-full lg:w-2/5 xl:w-1/3 h-64 lg:h-auto relative">
        <Carousel 
          autoplay 
          effect="fade" 
          className="h-full"
          dotPosition="right"
        >
          {promoSlides.map((slide, index) => (
            <div 
              key={index} 
              className={`h-full bg-gradient-to-br ${slide.color} text-white p-6 lg:p-12 flex flex-col justify-center`}
            >
              <div className="max-w-md mx-auto">
                <h2 className="text-xl lg:text-3xl font-bold mb-2 lg:mb-4">{slide.title}</h2>
                <p className="text-sm lg:text-xl mb-4 lg:mb-8">{slide.description}</p>
                <Button 
                  type="default" 
                  size="small lg:large"
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                >
                  Learn More
                </Button>
              </div>
              <div className="absolute inset-0 overflow-hidden w-full">
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="w-full h-full object-cover opacity-20"
                />
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      {/* Right Side - Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 lg:p-6">
          {/* Header */}
          <header className="mb-6 lg:mb-10 text-center">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-800 mb-2">
              Welcome to <span className="text-blue-600">Er-Car</span>
            </h1>
            <p className="text-base lg:text-lg text-gray-600">
              Your journey begins with the perfect rental car
            </p>
          </header>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-10">
            {[
              { icon: <CarOutlined />, value: "100+", label: "Vehicles" },
              { icon: <CheckOutlined />, value: "98%", label: "Satisfaction" },
              { icon: <SafetyOutlined />, value: "24/7", label: "Support" },
              { icon: <CustomerServiceOutlined />, value: "5-Star", label: "Service" }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-2 lg:p-4 rounded-lg shadow-sm text-center">
                <div className="text-xl lg:text-2xl text-blue-600 mb-1 lg:mb-2">{stat.icon}</div>
                <div className="text-lg lg:text-2xl font-bold">{stat.value}</div>
                <div className="text-xs lg:text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Advertisement banner */}
          <div className="mb-6 lg:mb-10">
            <AdSpace orientation="horizontal" />
          </div>

          {/* Categories Section */}
          <div className="mb-6 lg:mb-10">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 text-gray-800">Our Vehicle Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {/* Economic Cars */}
              <div 
                className="group overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-white"
                onClick={() => handleNavigation("/EconomicCar")}
              >
                <div className="relative pt-[75%]">
                  <img
                    src="/toyota.jpg"
                    alt="Economic Cars"
                    className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg md:text-xl text-blue-800 mb-2">Economic Cars are available click the image and filter economic car and you can get what you want</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Affordable and fuel-efficient vehicles perfect for city driving and short trips.
                    Our economic fleet includes reliable models from Toyota, Honda, and more.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-600">$60 - $95/day</span>
                    <button className="text-blue-600 hover:text-blue-800 font-medium">
                      View Options →
                    </button>
                  </div>
                </div>
              </div>

              {/* Middle Class Cars */}
              <div 
                className="group overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-white"
                onClick={() => handleNavigation("/EconomicCar")}
              >
                <div className="relative pt-[75%]">
                  <img
                    src="/minbus.jpg"
                    alt="Middle Class Cars"
                    className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg md:text-xl text-green-800 mb-2">Middle Class Cars  are available click the image and filter middleclass car and you can get what you want</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Comfortable and spacious vehicles with premium features for families and business trips.
                    Choose from SUVs, minivans, and luxury sedans.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-600">$100 - $300/day</span>
                    <button className="text-green-600 hover:text-green-800 font-medium">
                      View Options →
                    </button>
                  </div>
                </div>
              </div>

              {/* VIP Cars */}
              <div 
                className="group overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-white"
                onClick={() => handleNavigation("/EconomicCar")}
              >
                <div className="relative pt-[75%]">
                  <img
                    src="/novitec.jpg"
                    alt="VIP Cars"
                    className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg md:text-xl text-amber-800 mb-2">VIP Luxury Cars  are available click the image and filter economic car and you can get what you want</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Experience ultimate luxury with our premium collection of high-end vehicles.
                    Includes sports cars, luxury SUVs, and chauffeur services.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-amber-600">$500 - $950/day</span>
                    <button className="text-amber-600 hover:text-amber-800 font-medium">
                      View Options →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-blue-600 text-white rounded-xl p-4 lg:p-8 text-center">
            <h2 className="text-xl lg:text-2xl font-bold mb-2 lg:mb-3">Ready for Your Next Adventure?</h2>
            <p className="mb-4 lg:mb-6 text-sm lg:text-base">Book your perfect car today and enjoy special discounts</p>
            <Button 
              type="default" 
              size="large"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              onClick={() => handleNavigation("/EconomicCar")}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}