'use client'

import { UploadOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, Row, Upload } from 'antd';
import React, { useState } from 'react'

export const AdminDashboard = () => {

  const [allCarData, setallCarData] = useState([{}]);
  const [editingMode, setEditingMode] = useState(false);

  const [form]= Form.useForm();

  const columns = [
    {
      title:'Car Code',
      dataIndex: 'car_code',
      key: 'car_code'
    },

    {
      titlle: 'Make',
      dataIndex: 'make',
      key: 'make'
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model'
    },
    {
      title: 'Rating',
      dataIndex:'rating',
      key:'rating'
    },
    {
      title:'Description',
      dataIndex:'description',
      key:'description'
    },
    {
      title:'Price',
      dataIndex:'price',
      key:'price'
    },
    {
      title:'Image',
      dataIndex:'image',
      key:'image'
    },
    {
      title:'Year',
      dataIndex:'year',
      key:'year'
    },
    {
      title:'OwnerId',
      dataIndex:'owner_id',
      key:'owner_id'
    },
    {
      title:'Car Type ID',
      dataIndex:'car_type_id',
      key:'car_type_id'
    }
  ]

  const handleEdit =(record)=>{

    console.log("record to edit", record);
    form.setFieldsValue({
      car_code: record.car_code,
      make: record.make,
      model: record.model,
      rating: record.rating,
      description: record.description,
      price: record.price,
      image: record.image,
      year: record.year,
      owner_id: record.owner_id,
      car_type_id: record.car_type_id,
      id:record.id

    });
    setEditingMode(true);

  }

const clearData = ()=>{
  form.setFieldsValue({
    car_code:"",
    make:"",
    model:"",
    rating:"",
    description:"",
    price:"",
    image:"",
    year:"",
    owner_id:"",
    car_type_id:"",
    id:""
  })
  setEditingMode(false);
}

const getData = async ()=>{
  const url = "/api/car";
  try {
    const response = await fetch(url);
    if(!response.ok){
      throw new Error(`Response status :${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    setallCarData(data);
  } catch (error) {
    error:error
  }
}


const saveData = async (values)=>{
  const url = "/api/car";
  try {
    const response = await fetch(url,{
        method: 'POST',
        headers:{
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
    }
     
    );
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const data = await response.json();
      console.log("car data",data);
      getData();
  } catch (error) {
    
  }
}


const updateData =async (values) =>{
  const url = "/api/car";
  try {
    const response = await fetch(url,{
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(values) 
      });

      if(!response.ok){
        throw new Error(`Response status: {response.status}`);
      }
      const data= await response.json();
      console.log("car data updated",data);
      getData();
  } catch (error) {
     console.error("Error fetching car data:", error);
  }
};

 const deletethedata = async (values) => {
    const url = "/api/car";

    if (confirm('Are you sure you want to delete this car?')) 
    {
        try {
      const response = await fetch(url,{
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ car_code: values.car_code })
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const data = await response.json();
      console.log("car data delete",data);
      getData();
    } catch (error) {
      console.error("Error fetching car data:", error);
    }
    }
    else
    {
        return
    }
  
    const onFinish = (values) =>{
       console.log(values);
       editingMode?updateData(values):saveData(values);
    };

  return (
    <div>
      <Row gutter={3}>
        <Col span={8} style={{padding:"10px"}}>
         <div className='pb-4 flex items-end justify-end'>
          <Button onClick={()=>clearData()}>Add New Car</Button>    
           </div>
           <Form
            {...formItemLayout}
       form={form}
      style={{ maxWidth: 600 }}
      initialValues={{ variant: 'filled' }}
      onFinish={onFinish}
      >
     {editingMode?(
        <Form.Item label="Id" name="id" rules={[{ required: true, message: 'Please input car code!' }]}>
        <Input />
      </Form.Item>):null}

      <Form.Item label="Car Code" name="car_code" rules={[{ required: true, message: 'Please input car code!' }]}>
        <Input />
      </Form.Item>


      <Form.Item label="Make" name="fathername" rules={[{ required: true, message: 'Please input make!' }]}>
        <Input />
      </Form.Item>

      <Form.Item label="Model" name="model" rules={[{ required: true, message: 'Please input model name!' }]}>
        <Input />
      </Form.Item>

      <Form.Item label="Rating" name="rating" rules={[{ required: true, message: 'Please input rating!' }]}>
        <Input />
      </Form.Item>

 
      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: 'Please input your description!' }]}
      
        >
         <Form.Item
        label="Price"
        name="price"
        rules={[{ required: true, message: 'Please input car price!' }]}
      
        >
         <Form.Item
      name="upload"
      label="Image"
      valuePropName="fileList"
      getValueFromEvent={normFile}
      extra="longgggggggggggggggggggggggggggggggggg"
    >
      <Upload name="logo" action="/upload.do" listType="picture">
        <Button icon={<UploadOutlined />}>Click to upload</Button>
      </Upload>
    </Form.Item>
      <Form.Item
        label="Year"
        name="year"
        rules={[{ required: true, message: 'Please input car manufacture year!' }]}
      
        >
          <Form.Item
        label="Owner Id"
        name="owner_id"
        rules={[{ required: true, message: 'Please input owner id!' }]}
      
        >
          <Form.Item
        label="Car Type Id"
        name="car_type_id"
        rules={[{ required: true, message: 'Please input car type id!' }]}
      
        ></Form.Item>
        </Form.Item>
        </Form.Item>
        </Form.Item>
      
      </Form.Item>

   

      <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
       {editingMode?(<Button type="primary" htmlType="submit">
          Update
        </Button>):(<Button type="primary" htmlType="submit">
          Save
        </Button>)} 
      </Form.Item>
    </Form>
        </Col>

      </Row>
    </div>
  )
}
};
