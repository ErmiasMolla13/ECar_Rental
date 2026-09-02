'use client'

import { useEffect, useState } from 'react';
import React from 'react';

import {
  Button,
  Cascader,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Mentions,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  TreeSelect,
} from 'antd';
const { RangePicker } = DatePicker;
const {Option} = Select
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 },
  },
};
const Crud = () => {

   const [allcruddata, setallcruddata] = useState([{}])
   const [editingmode, seteditingmode] = useState(false);
    useEffect(() => {
        getsaveddata()
    }, [])
    
  const [form] = Form.useForm();

  const columns = [
    {
      title: 'First Name',
      dataIndex: 'firstname',
      key: 'firstname',
    },
    {
        title: 'Father Name',
        dataIndex: 'fathername',
        key: 'fathername',
    },
    {
        title: 'Grand Father Name',
        dataIndex: 'gfathername',
        key: 'gfathername',
    },
    {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
    },
    {
        title: 'Favourate Color',
        dataIndex: 'fav_color',
        key: 'fav_color',
    },
    {
        title: 'Action',
        key: 'action',
        render: (_, record) => (
          <Space size="middle">
            <Button size="small" 
            type="primary"
            onClick={()=>handleEdit(record)}>Edit</Button>
            <Button size="small" type="primary" danger onClick={()=>deletethedata(record)}>Delete</Button>
          </Space>
        ),
     }

]
  //Editing row
  const handleEdit = (record) =>{
    //setEditingId(record.id);
    console.log("record to update",record)
    form.setFieldsValue({
        firstname: record.firstname,
        fathername: record.fathername,
        gfathername: record.gfathername,
        description: record.description,       
        fav_color: record.fav_color,
        id:record.id
      });
      seteditingmode(true)
  }

//Delete record

const handleDelete = (record) =>{
    //setEditingId(record.id);
    console.log("record to delete",record)
    
      seteditingmode(true)
  }


  //clear form data 

  const clearformdata = ()=>{
    form.setFieldsValue({
        firstname:"",
        fathername: "",
        gfathername: "",
        description: "",       
        fav_color: "",
        id:""
  })
  seteditingmode(false)
}

//function to get data

const getsaveddata = async ()=>{
    const url = "http://localhost:3000/api/crud";
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
          }
          const json_data = await response.json();
          console.log("all crud data", json_data);
          setallcruddata(json_data)
    }
    catch{

    }
}

//function to save data
  const savethedata = async (values) => {
    const url = "http://localhost:3000/api/crud";
    try {
      const response = await fetch(url,{
        method: 'POST', // Specify the request method
        headers: {
          'Content-Type': 'application/json' // Set the content type to JSON
        },
        body: JSON.stringify(values) // Convert the data object to a JSON string
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json_data = await response.json();
      console.log("crud data", json_data);
      getsaveddata()
    } catch (error) {
      console.error("Error fetching car data:", error);
    }
  };


  //function to update the data
  const updatethedata = async (values) => {
    const url = "http://localhost:3000/api/crud";
    try {
      const response = await fetch(url,{
        method: 'PUT', // Specify the request method
        headers: {
          'Content-Type': 'application/json' // Set the content type to JSON
        },
        body: JSON.stringify(values) // Convert the data object to a JSON string
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json_data = await response.json();
      console.log("crud data updated", json_data);
      getsaveddata()
    } catch (error) {
      console.error("Error fetching car data:", error);
    }
  };


  //function to delete the data
  const deletethedata = async (values) => {
    const url = `http://localhost:3000/api/crud?del_id=${values.id}`;
    //console.log("delete data api url",url)
    if (confirm('Are you sure you want to delete this car?')) 
    {
        try {
      const response = await fetch(url,{
        method: 'DElETE', // Specify the request method
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json_data = await response.json();
      console.log("crud data delete", json_data);
      getsaveddata()
    } catch (error) {
      console.error("Error fetching car data:", error);
    }
    }
    else
    {
        return
    }
    
  };


  const onFinish = (values) => {
    console.log(values);
    editingmode?updatethedata(values):savethedata(values)
    
    
  };

  return (<div>
   
   <Row gutter={2}>
    <Col span={8} style={{padding:"10px"}}>
    <div className='pb-4 flex items-end justify-end'><Button onClick = {()=>clearformdata()}>Add New</Button></div>
    <Form
      {...formItemLayout}
      form={form}
      style={{ maxWidth: 600 }}
      initialValues={{ variant: 'filled' }}
      onFinish={onFinish}
    >
     {editingmode?(
        <Form.Item label="Id" name="id" rules={[{ required: true, message: 'Please input first name!' }]}>
        <Input />
      </Form.Item>):null}

      <Form.Item label="First Name" name="firstname" rules={[{ required: true, message: 'Please input first name!' }]}>
        <Input />
      </Form.Item>


      <Form.Item label="Father Name" name="fathername" rules={[{ required: true, message: 'Please input father name!' }]}>
        <Input />
      </Form.Item>

      <Form.Item label="Grand Father Name" name="gfathername" rules={[{ required: true, message: 'Please input gfather name!' }]}>
        <Input />
      </Form.Item>

      <Form.Item label="Description" name="description" rules={[{ required: true, message: 'Please input desc!' }]}>
        <Input />
      </Form.Item>

 
      <Form.Item
        label="Favourate color"
        name="fav_color"
        rules={[{ required: true, message: 'Please input favourate color!' }]}
      
        >
      <Select placeholder="Please select favourite colors">
        <Option value="red">Red</Option>
        <Option value="green">Green</Option>
        <Option value="blue">Blue</Option>
      </Select>
      </Form.Item>

   

      

      {/* <Form.Item
        label="DatePicker"
        name="DatePicker"
        rules={[{ required: true, message: 'Please input!' }]}
      >
        <DatePicker />
      </Form.Item>

      <Form.Item
        label="RangePicker"
        name="RangePicker"
        rules={[{ required: true, message: 'Please input!' }]}
      >
        <RangePicker />
      </Form.Item> */}

      <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
       {editingmode?(<Button type="primary" htmlType="submit">
          Update
        </Button>):(<Button type="primary" htmlType="submit">
          Save
        </Button>)} 
      </Form.Item>
    </Form>

    </Col>
    <Col span={16}>
    <Table columns={columns} dataSource={allcruddata} />
    </Col>
   </Row>
    
    
    </div>);
};
export default Crud;