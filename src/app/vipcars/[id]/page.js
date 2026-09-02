'use client';

import { useRouter } from 'next/navigation';
import { Vip } from '../../../data/vipcar';
import Link from 'next/link';




export default function CarDetails({ params }) {
  const router = useRouter();
  const { id } = params;


  const car = Vip.find((car) => car.id === parseInt(id));

  if (!car) {
    return (<div>Car not found</div>);
  }

  const handleClick = () => {
    router.push('/login');
  };

  return (
    <div className='min-h-screen flex'>
      <div className='min-h-screen bg-gray-100 p-6 flex-1 '>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className='p-4 '>
            <Link href="../vipcars" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-800">Back</Link>
          </div>

          <div className=' h-auto w-full'>
            <img
              src={car.image}
              alt={car.name}
              className='w-full h-full object-cover'
            />
          </div>
          <div className='bg-gray-300 text-center '>
            <p className='text-3xl font-bold mb-6 ml-4'>Name: {car.name}</p>
            <p className='text-3xl  text-bold shadow-md'>Description</p>
            <p className='text-xl font-semibold mb-6'>{car.description}</p>
            <p className='text-xl font-semibold'>Price per day: {car.price}</p>
          </div>
          <div className='p-4 text-center'>
            <button
              onClick={handleClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-800"
            >
              Book Car
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-slate-800 p-6">
        <div className='min-h-screen flex flex-col'>
          <div className='flex-1 bg-amber-200 p-6'>
            <h1 className='text-2xl'>Ad</h1>
          </div>
          <div className="flex-1 bg-amber-500 p-6">
            <h1 className="text-white text-2xl font-bold">Ad2</h1>
          </div>
        </div>
      </div>



    </div>
  );
}