'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Drawer, Button, Row, Col, Card, Image, Avatar } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import EcoCars from '../components/EconomicCar.js';
import Meta from 'antd/es/card/Meta.js';

export default function CarsPage() {
  const [Eco, setEco] = useState([]); // Initialize with empty array instead of array with empty object
  const [filteredCars, setFilteredCars] = useState([]);

  const getData = async () => {
    const url = "http://localhost:3000/api/car?car_type_id=1";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json_data = await response.json();
      console.log("car data", json_data);
      setFilteredCars(json_data);
      setEco(json_data);
    } catch (error) {
      console.error("Error fetching car data:", error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <Row gutter={4}>
        <Col span={4} style={{ borderRight: "1px solid #ccc", backgroundColor: "#eee" }}>
          {/* sidebar menu */}
        </Col>

        <Col span={20}>
          <div className='flex flex-wrap gap-4'>
            {Eco.map((c) => (
              <Card
                hoverable
                key={c?.id || `${c?.make}-${c?.model}-${c?.year}`} // Fallback key if id is missing
                style={{ width: 240 }}
                cover={<Image alt="car image" src={c?.image} preview={false} />}
              >
                <Meta className='text-lg' />
                <div className='text-lg text-blue-600'>
                  {`${c?.make || 'Make not available'}-${c?.model || 'Model not available'}`}<br />
                  Price: {c?.price ? `${c.price}$` : 'Price not available'}<br />
                  Description: {c?.description || 'No description available'}<br />
                  Rating: {c?.rating || 'Not rated'}<br />
                  <Button type="primary">View detail</Button>
                </div>
              </Card>
            ))}
          </div>
        </Col>
      </Row>
    </>
  );
}