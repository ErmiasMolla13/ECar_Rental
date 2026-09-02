'use client'

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button, Card, Col, Image, Modal, Row, DatePicker, Form, Input, message, Drawer, Slider, Select, Spin, Rate } from 'antd'
import Meta from 'antd/es/card/Meta'
import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FilterOutlined } from '@ant-design/icons'
import AdSpace from '../components/AdSpace'


const CarRentalPage = () => {
  const router = useRouter()
  const [allCars, setAllCars] = useState([])
  const [filteredCars, setFilteredCars] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRentModalOpen, setIsRentModalOpen] = useState(false)
  const [selectedCar, setSelectedCar] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [bookingData, setBookingData] = useState(null)
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [userRating, setUserRating] = useState(0)
  const [ratingLoading, setRatingLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerData, setCustomerData]= useState(null);
  const [loginDrawerVisible, setLoginDrawerVisible] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // 'rent' | { type: 'rate', car }
  const [signInForm] = Form.useForm()
  const [signInLoading, setSignInLoading] = useState(false)
  const [signInError, setSignInError] = useState(null)
  const carsPerPage = 8
  const [loading, setLoading] = useState(true)

  // Filter state
  const [filterValues, setFilterValues] = useState({
    priceRange: [0, 1000],
    yearRange: [2000, new Date().getFullYear()],
    make: null,
    carType: null
  })

  // Calculate pagination
  const indexOfLastCar = currentPage * carsPerPage
  const indexOfFirstCar = indexOfLastCar - carsPerPage
  const currentCars = filteredCars.slice(indexOfFirstCar, indexOfLastCar)
  const totalPages = Math.ceil(filteredCars.length / carsPerPage)
  
  // Fetch car data
  const getData = async () => {
    const url = "/api/car?is_booked=false";
    setLoading(true);
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`)
      }
      const json_data = await response.json()
      setAllCars(json_data)
      setFilteredCars(json_data)
      
      if (json_data.length > 0) {
        const prices = json_data.map(car => car.price)
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        setFilterValues(prev => ({
          ...prev,
          priceRange: [minPrice, maxPrice]
        }));
      }
    } catch (error) {
      console.error("Error fetching car data:", error)
      toast.error('Failed to load car data')
    } finally {
      setLoading(false)
    }
  }

  // Get unique makes for filter dropdown
  const getUniqueMakes = () => {
    const makes = [...new Set(allCars.map(car => car.make))]
    return makes.map(make => ({ value: make, label: make }))
  }

  // Apply filters
  const applyFilters = () => {
    let result = [...allCars]
    
    if (filterValues.carType) {
      result = result.filter(car => car.car_type === filterValues.carType)
    }
    
    result = result.filter(car => 
      car.price >= filterValues.priceRange[0] && 
      car.price <= filterValues.priceRange[1]
    )
    
    result = result.filter(car => 
      car.year >= filterValues.yearRange[0] && 
      car.year <= filterValues.yearRange[1]
    )
    
    if (filterValues.make) {
      result = result.filter(car => car.make === filterValues.make)
    }
    
    setFilteredCars(result)
    setCurrentPage(1)
  }

  const handleFilterChange = (name, value) => {
    setFilterValues(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetFilters = () => {
    const prices = allCars.map(car => car.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    setFilterValues({
      priceRange: [minPrice, maxPrice],
      yearRange: [2000, new Date().getFullYear()],
      make: null,
      carType: null
    })
    setFilteredCars(allCars)
  }

  // Modal handlers
  const showModal = (car) => {
    setSelectedCar(car)
    setUserRating(car.rating || 0)
    setIsModalOpen(true)
  }

  const showRentModal = () => {
    withCustomerAuth(() => {
      setIsModalOpen(false)
      setIsRentModalOpen(true)
    })
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  const handleRentCancel = () => {
    setIsRentModalOpen(false)
  }

  const submitRating = async (car, value) => {
    setRatingLoading(true);
    try {
      const response = await fetch('/api/carReview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_id: car.id,
          review_score: value,
          review: ''
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          toast.error('Please sign in to rate this car.');
          return;
        }
        throw new Error(result.error || 'Failed to update rating');
      }

      toast.success('Thanks for rating this car!');
      setUserRating(value);
      setAllCars(prev => prev.map(c =>
        c.car_code === car.car_code ? { ...c, rating: result.rating } : c
      ));
      setFilteredCars(prev => prev.map(c =>
        c.car_code === car.car_code ? { ...c, rating: result.rating } : c
      ));
    } catch (error) {
      console.error('Rating update error:', error);
      toast.error(error.message || 'Failed to update rating');
    } finally {
      setRatingLoading(false);
    }
  };

  // Only a signed-in customer may rate a car; anonymous visitors are
  // prompted to sign in first, and their star click is applied automatically
  // once they've logged in.
  const handleRatingChange = (value) => {
    if (!selectedCar) return;
    withCustomerAuth(() => submitRating(selectedCar, value));
  };

  const handleBookingSubmit = (data) => {
    const pickupDate = dayjs(data.pickup_date)
    const returnDate = dayjs(data.return_date)
    const rentalDays = returnDate.diff(pickupDate, 'day') + 1
    const totalEstimate = rentalDays * selectedCar.price

    setBookingData({
      values: data,
      rentalDays,
      totalEstimate,
      pickupDate: data.pickup_date,
      returnDate: data.return_date
    })
    setShowConfirmation(true)
  }   

  const handlePayment = async () => {
    try {
      if (!selectedCar?.id) {
        throw new Error("Missing car or Missing car id")
      }

      if (!bookingData?.values) {
        throw new Error("Booking data is incomplete")
      }

      const payload = {
        car_id: selectedCar.id,
        customer_name: bookingData.values.customer_name,
        email: bookingData.values.email,
        pickup_date: dayjs(bookingData.values.pickup_date).format('YYYY-MM-DD'),
        return_date: dayjs(bookingData.values.return_date).format('YYYY-MM-DD'),
        total_price: bookingData.totalEstimate,
        rental_days: bookingData.rentalDays
      }

      // First create the rent record
      const rentResponse = await fetch("/api/rent", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rent_date: dayjs().format('YYYY-MM-DD'),
          pickup_date: payload.pickup_date,
          return_date: payload.return_date,
          customer_name: payload.customer_name,
          email: payload.email,
          car_id: payload.car_id
        })
      });

      if (!rentResponse.ok) {
        throw new Error('Failed to create rent record');
      }

      // Then create the booking
      const bookingResponse = await fetch("/api/bookings", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const responseData = await bookingResponse.json();
      
      if (!bookingResponse.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${bookingResponse.status}`)
      }

      // Update car status to booked
      await fetch('/api/car', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_code: selectedCar.car_code,
          is_booked: true,
          booking_info: JSON.stringify({
            customer_name: bookingData.values.customer_name,
            email: bookingData.values.email,
            pickup_date: bookingData.values.pickup_date,
            return_date: bookingData.values.return_date,
            total_price: bookingData.totalEstimate,
            rental_days: bookingData.rentalDays
          })
        })
      });

      // Refresh data after successful booking
      await getData()

      toast.success('Booking confirmed! Please visit our nearest branch to complete payment.', {
        position: "top-center",
        autoClose: 2000,
      })
      
      setTimeout(() => {
        setShowConfirmation(false)
        setIsRentModalOpen(false)
        router.push('/')
      }, 5000)

    } catch (error) {
      console.error("Booking error details:", error)
      toast.error(`Booking failed: ${error.message}`, {
        position: 'top-center',
        autoClose: 5000
      })
    }
  }

  const showFilterDrawer = () => {
    setFilterDrawerVisible(true)
  }

  const closeFilterDrawer = () => {
    setFilterDrawerVisible(false)
  }

  useEffect(() => {
    getData()
  }, [])

  // Check whether a customer is already signed in (e.g. after a page
  // refresh) so renting/rating doesn't ask them to log in again.
  const checkCustomerSession = async () => {
    try {
      const response = await fetch('/api/auth/check?role=customer')
      const data = await response.json()
      if (data.authenticated) {
        setIsAuthenticated(true)
        setCustomerData(prev => ({ ...prev, ...data.user }))
      } else {
        setIsAuthenticated(false)
        setCustomerData(null)
      }
    } catch (error) {
      console.error('Session check failed:', error)
    }
  }

  useEffect(() => {
    checkCustomerSession()
  }, [])

  // Runs `action` if a customer is signed in; otherwise opens the sign-in
  // drawer and remembers what to do once they've successfully logged in.
  const withCustomerAuth = (action) => {
    if (isAuthenticated) {
      action()
    } else {
      setPendingAction(() => action)
      setSignInError(null)
      setLoginDrawerVisible(true)
    }
  }

  const handleSignInSubmit = async (values) => {
    setSignInLoading(true)
    setSignInError(null)
    try {
      const response = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          password: values.password
        })
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          setSignInError('Please verify your email before signing in. Check your inbox, or ')
        } else {
          setSignInError(data.error || 'Sign in failed. Please check your email and password.')
        }
        return
      }

      setIsAuthenticated(true)
      setCustomerData(data.user)
      setLoginDrawerVisible(false)
      signInForm.resetFields()
      toast.success('Signed in successfully!', { position: 'top-center', autoClose: 3000 })

      if (pendingAction) {
        const action = pendingAction
        setPendingAction(null)
        action()
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setSignInError('Something went wrong. Please try again.')
    } finally {
      setSignInLoading(false)
    }
  }

  useEffect(() => {
    applyFilters()
  }, [filterValues, allCars])

  const getTitle = () => {
    if (filterValues.carType) {
      switch(filterValues.carType) {
        case 'economic': return 'Economic Cars'
        case 'middleclass': return 'Middle Class Cars'
        case 'vip': return 'VIP Luxury Cars'
        default: return 'All Rental Cars'
      }
    }
    return 'All Rental Cars'
  }

  const getCarTypeLabel = (type) => {
    switch(type) {
      case 'economic': return 'Economic'
      case 'middleclass': return 'Middle Class'
      case 'vip': return 'VIP Luxury'
      default: return type
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer 
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="md:hidden p-4">
        <Button 
          type="primary" 
          icon={<FilterOutlined />}
          onClick={showFilterDrawer}
          className="w-full"
        >
          Filter Cars
        </Button>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <div className="hidden md:block md:w-1/4 lg:w-1/5 bg-white border-r border-gray-200 p-4">
          <h2 className="text-xl font-bold mb-4">Filter Cars</h2>
          <Form layout="vertical">
            <Form.Item label="Car Type">
              <Select
                placeholder="All Types"
                value={filterValues.carType}
                onChange={(value) => handleFilterChange('carType', value)}
                options={[
                  { value: null, label: 'All Types' },
                  { value: 'economic', label: 'Economic' },
                  { value: 'middleclass', label: 'Middle Class' },
                  { value: 'vip', label: 'VIP Luxury' }
                ]}
                allowClear
              />
            </Form.Item>

            <Form.Item label="Price Range">
              <Slider
                range
                min={0}
                max={1000}
                value={filterValues.priceRange}
                onChange={(value) => handleFilterChange('priceRange', value)}
                tipFormatter={(value) => `$${value}`}
              />
              <div className="flex justify-between">
                <span>${filterValues.priceRange[0]}</span>
                <span>${filterValues.priceRange[1]}</span>
              </div>
            </Form.Item>
            
            <Form.Item label="Year Range">
              <Slider
                range
                min={2000}
                max={new Date().getFullYear()}
                value={filterValues.yearRange}
                onChange={(value) => handleFilterChange('yearRange', value)}
              />
              <div className="flex justify-between">
                <span>{filterValues.yearRange[0]}</span>
                <span>{filterValues.yearRange[1]}</span>
              </div>
            </Form.Item>
            
            <Form.Item label="Make">
              <Select
                placeholder="All Makes"
                options={getUniqueMakes()}
                value={filterValues.make}
                onChange={(value) => handleFilterChange('make', value)}
                allowClear
              />
            </Form.Item>
            
            <div className="flex gap-2">
              <Button 
                type="primary" 
                onClick={applyFilters}
                className="bg-blue-600"
              >
                Apply Filters
              </Button>
              <Button onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </Form>

          <div className="mt-6">
            <AdSpace orientation="vertical" />
          </div>
        </div>

        {/* Mobile Drawer */}
        <Drawer
          title="Filters"
          placement="left"
          width={300}
          onClose={closeFilterDrawer}
          open={filterDrawerVisible}
        >
          <Form layout="vertical">
            <Form.Item label="Car Type">
              <Select
                placeholder="All Types"
                value={filterValues.carType}
                onChange={(value) => handleFilterChange('carType', value)}
                options={[
                  { value: null, label: 'All Types' },
                  { value: 'economic', label: 'Economic' },
                  { value: 'middleclass', label: 'Middle Class' },
                  { value: 'vip', label: 'VIP Luxury' }
                ]}
                allowClear
              />
            </Form.Item>

            <Form.Item label="Price Range">
              <Slider
                range
                min={0}
                max={1000}
                value={filterValues.priceRange}
                onChange={(value) => handleFilterChange('priceRange', value)}
                tipFormatter={(value) => `$${value}`}
              />
              <div className="flex justify-between">
                <span>${filterValues.priceRange[0]}</span>
                <span>${filterValues.priceRange[1]}</span>
              </div>
            </Form.Item>
            
            <Form.Item label="Year Range">
              <Slider
                range
                min={2000}
                max={new Date().getFullYear()}
                value={filterValues.yearRange}
                onChange={(value) => handleFilterChange('yearRange', value)}
              />
              <div className="flex justify-between">
                <span>{filterValues.yearRange[0]}</span>
                <span>{filterValues.yearRange[1]}</span>
              </div>
            </Form.Item>
            
            <Form.Item label="Make">
              <Select
                placeholder="All Makes"
                options={getUniqueMakes()}
                value={filterValues.make}
                onChange={(value) => handleFilterChange('make', value)}
                allowClear
              />
            </Form.Item>
            
            <div className="flex gap-2">
              <Button 
                type="primary" 
                onClick={() => {
                  applyFilters()
                  closeFilterDrawer()
                }}
                className="bg-blue-600"
              >
                Apply Filters
              </Button>
              <Button onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </Form>
        </Drawer>

        {/* Main Content */}
        <div className="w-full md:w-3/4 lg:w-4/5 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {getTitle()} ({filteredCars.length})
              </h1>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" />
              </div>
            ) : filteredCars.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentCars.map((car) => (
                    <Card
                      hoverable
                      key={car.id}
                      cover={
                        <div className="aspect-video rounded-2xl border-blue-500 bg-gray-100">
                          <Image
                            alt={`${car.make} ${car.model}`}
                            src={car.image || '/car-placeholder.jpg'}
                            preview={false}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      }
                    >
                      <Meta
                        title={`${car.make} ${car.model}`}
                        description={
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="text-lg font-semibold text-blue-700">${car.price?.toLocaleString()}</p>
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                {getCarTypeLabel(car.car_type)}
                              </span>
                            </div>
                            <p className='text-blue-700'>Year: {car.year}</p>
                            <div className="flex justify-between items-center mt-4">
                              <Rate 
                                disabled 
                                value={car.rating || 0} 
                                allowHalf 
                                style={{ fontSize: 14 }} 
                              />
                              <Button 
                                type="primary" 
                                onClick={() => showModal(car)}
                                className="bg-blue-600"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        }
                      />
                    </Card>
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

                <div className="mt-4 text-center text-gray-600">
                  Showing cars {indexOfFirstCar + 1}-{Math.min(indexOfLastCar, filteredCars.length)} of {filteredCars.length}
                </div>
              </>
            ) : (
              <div className="text-center py-10 bg-white rounded-lg shadow">
                <h3 className="text-xl font-bold mb-2">No cars match your filters</h3>
                <p className="text-gray-600">Try adjusting your filter criteria</p>
                <Button 
                  type="link" 
                  onClick={resetFilters}
                  className="text-blue-600 mt-2"
                >
                  Reset filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Car Details Modal */}
      <Modal
        title={`${selectedCar?.make} ${selectedCar?.model}`}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Close
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={showRentModal}
            className="bg-blue-600"
          >
            Book Now
          </Button>
        ]}
        width={800}
      >
        {selectedCar && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <Image
                src={selectedCar.image}
                alt={selectedCar.make}
                className="w-full rounded-lg"
                preview={true}
              />
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <div className="flex justify-between items-center text-green-600">
                <h3 className="text-2xl font-bold">${selectedCar.price?.toLocaleString()}</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {getCarTypeLabel(selectedCar.car_type)}
                </span>
              </div>
              
              <div>
                <p className="font-semibold text-blue-700">Description</p>
                <p>{selectedCar.description || 'No description available'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-blue-700">
                <div>
                  <p className="font-semibold">Year</p>
                  <p>{selectedCar.year}</p>
                </div>
                <div>
                  <p className="font-semibold">Make</p>
                  <p>{selectedCar.make}</p>
                </div>
                <div>
                  <p className="font-semibold">Model</p>
                  <p>{selectedCar.model}</p>
                </div>
                <div>
                  <p className="font-semibold">Rating</p>
                  <Rate 
                    value={userRating} 
                    onChange={handleRatingChange} 
                    allowHalf 
                    disabled={ratingLoading}
                  />
                  <span className="ml-2">{userRating?.toFixed(1) || 'Not rated'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Rent Modal */}
      {isRentModalOpen && (
        <RentModal
          selectedCar={selectedCar}
          onCancel={handleRentCancel}
          onSubmit={handleBookingSubmit}
          customerData={customerData}
        />
      )}

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Booking"
        open={showConfirmation}
        onOk={handlePayment}
        onCancel={() => setShowConfirmation(false)}
        okText="Confirm Payment"
        cancelText="Cancel"
      >
        {bookingData && (
          <div className="space-y-4">
            <p>You are booking: <strong>{selectedCar?.make} {selectedCar?.model}</strong></p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Pickup:</p>
                <p>{dayjs(bookingData.pickupDate).format('MMMM D, YYYY')}</p>
              </div>
              <div>
                <p className="font-medium">Return:</p>
                <p>{dayjs(bookingData.returnDate).format('MMMM D, YYYY')}</p>
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span>Days:</span>
                <span>{bookingData.rentalDays}</span>
              </div>
              <div className="flex justify-between">
                <span>Daily Rate:</span>
                <span>${selectedCar?.price?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${bookingData.totalEstimate.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Sign-in prompt: shown whenever a signed-out visitor tries to rent
          or rate a car. Logging in here resumes whatever they were doing. */}
      <Drawer
        title="Sign in to continue"
        placement="right"
        width={380}
        open={loginDrawerVisible}
        onClose={() => {
          setLoginDrawerVisible(false)
          setPendingAction(null)
          setSignInError(null)
          signInForm.resetFields()
        }}
      >
        <p className="text-gray-600 mb-4">
          Please sign in with your verified customer account to rent or rate a car.
        </p>

        {signInError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {signInError}
            {signInError.startsWith('Please verify') && (
              <>
                {' '}
                <Link href="/resend-verification" className="underline font-medium">
                  resend the verification email
                </Link>
                .
              </>
            )}
          </div>
        )}

        <Form
          form={signInForm}
          layout="vertical"
          onFinish={handleSignInSubmit}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input placeholder="Enter your email" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="Enter your password" autoComplete="current-password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={signInLoading} disabled={signInLoading}>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div className="flex justify-between text-sm">
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
          <span className="text-gray-500">
            New here? Use the <strong>Login</strong> menu in the header to register.
          </span>
        </div>
      </Drawer>
    </div>
  )
}

// RentModal Component
const RentModal = ({ selectedCar, onCancel, onSubmit, customerData }) => {
  const [form] = Form.useForm()
  const [rentalDays, setRentalDays] = useState(0)
  const [totalEstimate, setTotalEstimate] = useState(0);

  useEffect(() => {
    if (customerData) {
      form.setFieldsValue({
        customer_name: customerData.customer_name,
        email: customerData.email,
        contact: customerData.contact,
        address: customerData.address
      })
    }
  }, [customerData, form])

  useEffect(() => {
    const pickupDate = form.getFieldValue('pickup_date')
    const returnDate = form.getFieldValue('return_date')
    const carPrice = selectedCar?.price

    if (pickupDate && returnDate) {
      const days = returnDate.diff(pickupDate, 'day') + 1
      setRentalDays(days)
      setTotalEstimate(days * (carPrice || 0))
    } else {
      setRentalDays(0)
      setTotalEstimate(0)
    }
  }, [form, form.getFieldValue('pickup_date'), form.getFieldValue('return_date'), selectedCar?.price])

  const handleFinish = (values) => {
    onSubmit({
      ...values,
      pickup_date: values.pickup_date,
      return_date: values.return_date
    })
  }

  return (
    <Modal
      title={`Book ${selectedCar?.make} ${selectedCar?.model}`}
      open={true}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          pickup_date: dayjs().add(1, 'day'),
          return_date: dayjs().add(3, 'days')
        }}
      >
        <Form.Item
          name="pickup_date"
          label="Pickup Date"
          rules={[{ required: true, message: 'Please select pickup date' }]}
        >
          <DatePicker 
            className="w-full" 
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Form.Item
          name="return_date"
          label="Return Date"
          rules={[
            { required: true, message: 'Please select return date' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('pickup_date').isBefore(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Return date must be after pickup date'));
              },
            }),
          ]}
        >
          <DatePicker className="w-full" />
        </Form.Item>

        <Form.Item
          name="customer_name"
          label="Your Name"
          rules={[{ required: true, message: 'Please enter your name' }]}
        >
          <Input placeholder="John Doe" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input placeholder="your@email.com" />
        </Form.Item>

        <div className="mb-4 p-4 bg-gray-50 rounded">
          <div className="flex justify-between">
            <span>Daily Rate:</span>
            <span>${selectedCar?.price?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Rental Days:</span>
            <span>{rentalDays}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total Estimate:</span>
            <span>${totalEstimate.toLocaleString()}</span>
          </div>
        </div>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            size="large"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Confirm Booking
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CarRentalPage