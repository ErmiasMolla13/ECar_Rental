'use client'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button, Drawer, Form, Input, Tabs } from 'antd';
import TabPane from 'antd/es/tabs/TabPane';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useState } from 'react';

const LogInAs = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customerDrawer, setCustomerDrawer] = useState(false);
  const [ownerDrawer, setOwnerDrawer] = useState(false);
  const [adminDrawer, setAdminDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [customerLoginForm] = Form.useForm();
  const [customerRegisterForm] = Form.useForm();
  const [ownerLoginForm] = Form.useForm();
  const [ownerRegisterForm] = Form.useForm();
  const [adminLoginForm] = Form.useForm();
  const [adminRegisterForm] = Form.useForm();
  const [loading, setLoading] = useState({
    customer: false,
    register: false,
    owner: false,
    admin: false
  });

  // Drawer visibility handlers
  const showDrawer = () => setOpen(true);
  const onClose = () => {
    setOpen(false);
    setCustomerDrawer(false);
    setOwnerDrawer(false);
    setAdminDrawer(false);
    setActiveTab('1');
    customerLoginForm.resetFields();
    customerRegisterForm.resetFields();
    ownerLoginForm.resetFields();
    ownerRegisterForm.resetFields();
    adminLoginForm.resetFields();
    adminRegisterForm.resetFields();
  };

  const showCustomerDrawer = () => {
    setCustomerDrawer(true);
    
    setActiveTab('1');
    customerLoginForm.resetFields();
    customerRegisterForm.resetFields();
    
  };

  const onCustomerDrawerClose = () => {
    setCustomerDrawer(false);
    setActiveTab('1');
    customerLoginForm.resetFields();
    customerRegisterForm.resetFields();
  };

  const showOwnerDrawer = () => {
    setOwnerDrawer(true);
    setActiveTab('1');
    ownerLoginForm.resetFields();
    ownerRegisterForm.resetFields();
  };

  const onOwnerDrawerClose = () => {
    setOwnerDrawer(false);
    setActiveTab('1');
    ownerLoginForm.resetFields();
    ownerRegisterForm.resetFields();
  };

  const showAdminDrawer = () => {
    setAdminDrawer(true);
    setActiveTab('1');
    adminLoginForm.resetFields();
    adminRegisterForm.resetFields();
  };

  const onAdminDrawerClose = () => {
    setAdminDrawer(false);
    setActiveTab('1');
    adminLoginForm.resetFields();
    adminRegisterForm.resetFields();
  };

  const onTabChange = (key) => {
    setActiveTab(key);
    if (key === '1') customerLoginForm.resetFields();
    if (key === '2') customerRegisterForm.resetFields();
  };

  // Customer Sign In Function
const onCustomerFinishSignIn = async (values) => {
  try {
    setLoading({ ...loading, customer: true });

    const response = await fetch("/api/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || "Login failed. Please try again.");
    }

    toast.success("Login successful!", {
      position: "top-center",
      autoClose: 3000,
    });
    
    onClose();
    router.refresh();
  } catch (error) {
    console.error("Login error:", error);
    toast.error(error.message || "Login failed. Check your password and email.", {
      position: "top-center",
      autoClose: 5000,
    });
  } finally {
    setLoading({ ...loading, customer: false });
  }
};

// Customer Register Function
const onCustomerRegister = async (values) => {
  try {
    setLoading({ ...loading, register: true });

    if (values.password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email.trim())) {
      throw new Error("Please enter a valid email address");
    }

    const response = await fetch("/api/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: values.customer_name.trim(),
        contact: values.contact ? values.contact.trim() : "",
        address: values.address ? values.address.trim() : "",
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Registration failed. Please try again.");
    }

   
    toast.success(
      data.message || "Registration successful! A verification email has been sent.",
      {
        position: "top-center",
        autoClose: 6000,
      }
    );

    customerRegisterForm.resetFields();
    setActiveTab("1"); 
  } catch (error) {
    console.error("Registration error:", error);
    toast.error(
      error.message.includes("already exists") || error.message.includes("already registered")
        ? "Email already registered. Please login instead."
        : error.message || "Registration failed. Please try again.",
      {
        position: "top-center",
        autoClose: 5000,
      }
    );
  } finally {
    setLoading({ ...loading, register: false });
  }
};

  // Owner Sign In Function
  const onOwnerFinishSignIn = async (values) => {
    try {
      setLoading({...loading, owner: true});
      
      const response = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          password: values.password
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          toast.error(
            <span>
              Please verify your email before signing in.{' '}
              <Link href="/resend-verification" style={{ textDecoration: 'underline', fontWeight: 600 }}>
                Resend verification email
              </Link>
            </span>,
            { position: 'top-center', autoClose: 8000 }
          );
          return;
        }
        throw new Error(data.error || "Login failed. Please try again.");
      }

      toast.success("Login successful!", {
        position: 'top-center',
        autoClose: 5000,
      });
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        error.message.includes('credentials') || 
        error.message.includes('Invalid') || 
        error.message.includes('failed')
          ? error.message 
          : "Login failed. Please try again later.",
        {
          position: 'top-center',
          autoClose: 5000,
        }
      );
    } finally {
      setLoading({...loading, owner: false});
    }
  };

  // Owner Register Function
  const onOwnerRegister = async (values) => {
    try {
      setLoading({...loading, register: true});
      
      if (values.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.email.trim())) {
        throw new Error("Please enter a valid email address");
      }

      const response = await fetch("/api/owner/owner_register", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_name: values.owner_name.trim(),
          address: values.address.trim(),
          contact: values.contact.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message)
      }

      toast.success('Registration successful!', {
        position: 'top-center',
        autoClose: 5000,
      });
      onClose();
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.message.includes('already exists') 
          || "Email already registered. Please login instead.",
        {
          position: 'top-center',
          autoClose: 5000,
        }
      );
    } finally {
      setLoading({...loading, register: false});
    }
  };

  // Admin Sign In Function
  const onAdminFinishSignIn = async (values) => {
  try {
    setLoading((prev) => ({ ...prev, owner: true }));
    
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: values.email.trim().toLowerCase(),
        password: values.password
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data?.error || "Login failed. Please try again.");
    }

    toast.success("Login successful!", {
      position: 'top-center',
      autoClose: 2000,
    });

   if (onClose) onClose();
    window.location.href='/admin';
    router.refresh();

    onClose();

  } catch (error) {
    console.error("Login error:", error);
    setLoading((prev) => ({ ...prev, owner: false }));
    
    toast.error(
      error.message.includes('credentials') || 
      error.message.includes('Invalid') || 
      error.message.includes('failed')
        ? error.message 
        : "Login failed. Please try again later.",
      {
        position: 'top-center',
        autoClose: 5000,
      }
    );
  }
};

  // Admin Register Function
  const onAdminRegister = async (values) => {
  try {
    setLoading((prev) => ({ ...prev, register: true }));
    
    if (values.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email.trim())) {
      throw new Error("Please enter a valid email address");
    }

    const response = await fetch("/api/admin/admin_register", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin_name: values.admin_name.trim(),
        contact: values.contact.trim(),
        address: values.address.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      
      console.error("Backend Registration Response Error:", data);
      throw new Error(data.error_details || data.message || "Registration failed. Please try again.");
    }

    toast.success('Registration successful! Please check your email to verify your account.', {
      position: 'top-center',
      autoClose: 5000,
    });
    adminRegisterForm.resetFields();
    setActiveTab('1');
  } catch (error) {
    console.error("Registration error:", error);
    toast.error(
      error.message.includes('already exists') 
        ? "Email already registered. Please login instead."
        : error.message || 'Registration failed. Please try again.',
      {
        position: 'top-center',
        autoClose: 5000,
      }
    );
  } finally {
    setLoading((prev) => ({ ...prev, register: false }));
  }
};

  return (
    <div>
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
        style={{ 
              zIndex: 999999,  
              position: 'fixed' 
  }}
      />
      <Button type="primary" onClick={showDrawer}>
        Login
      </Button>
      
      <Drawer 
        title="Login As" 
        width={520}
        closable={true} 
        onClose={onClose} 
        open={open}
        destroyOnClose
        style={{ zIndex: 1000 }}
      >
        <div className='flex flex-col gap-4'>
          <Button type="primary" size='large' onClick={showCustomerDrawer}>
            Login as Customer
          </Button>
          <Button type="primary" size='large' onClick={showOwnerDrawer}>
            Login as Owner
          </Button>
          <Button type="primary" size='large' onClick={showAdminDrawer}>
            Login as Admin
          </Button>
        </div>

        {/* Customer Drawer */}
        <Drawer
          title="Customer"
          width={320}
          closable={true}
          onClose={onCustomerDrawerClose}
          open={customerDrawer}
          destroyOnClose
          style={{ zIndex: 1010 }}
        >
          <Tabs
            defaultActiveKey="1"
            activeKey={activeTab}
            onChange={onTabChange}
            centered
          >
            <TabPane tab="Sign In" key="1">
              <Form
                form={customerLoginForm}
                name="customer_signin"
                onFinish={onCustomerFinishSignIn}
                layout="vertical"
                initialValues={{ remember: true }}
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your email!' 
                    },
                    { 
                      type: 'email', 
                      message: 'Please enter a valid email!' 
                    },
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input 
                    placeholder="Enter your email" 
                    autoComplete="email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your password!' 
                    },
                    {
                      min: 6,
                      message: 'Password must be at least 6 characters!',
                    },
                  ]}
                >
                  <Input.Password 
                    placeholder="Enter your password" 
                    autoComplete="current-password"
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block
                    loading={loading.customer}
                    disabled={loading.customer}
                  >
                    Sign In
                  </Button>
                </Form.Item>
                <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 8 }}>
                  <Link href="/forgot-password" style={{ fontSize: 13 }}>Forgot password?</Link>
                </div>
              </Form>
            </TabPane>

            <TabPane tab="Register" key="2">
              <Form
                form={customerRegisterForm}
                name="customer_register"
                onFinish={onCustomerRegister}
                layout="vertical"
                scrollToFirstError
              >
                <Form.Item
                  name="customer_name"
                  label="Full Name"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your name!',
                      whitespace: true 
                    },
                    {
                      min: 3,
                      message: 'Name must be at least 3 characters!',
                    },
                  ]}
                >
                  <Input placeholder="Enter your full name" />
                </Form.Item>
                
                <Form.Item
                  name="contact"
                  label="Contact Number"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your contact number!' 
                    },
                    {
                      pattern: /^[0-9]{10,15}$/,
                      message: 'Please enter a valid phone number!',
                    },
                  ]}
                >
                  <Input placeholder="Enter your contact number" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your email!' 
                    },
                    { 
                      type: 'email', 
                      message: 'Please enter a valid email!' 
                    },
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input placeholder="Enter your email" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your password!' 
                    },
                    { 
                      min: 6, 
                      message: 'Password must be at least 6 characters!' 
                    },
                  ]}
                  hasFeedback
                >
                  <Input.Password placeholder="Enter your password" />
                </Form.Item>

                <Form.Item
                  name="confirm"
                  label="Confirm Password"
                  dependencies={['password']}
                  hasFeedback
                  rules={[
                    {
                      required: true,
                      message: 'Please confirm your password!',
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The two passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm your password" />
                </Form.Item>
                
                <Form.Item
                  name="address"
                  label="Address"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your address!',
                      whitespace: true 
                    },
                    {
                      min: 1,
                      message: 'Address must be at least 10 characters!',
                    },
                  ]}
                >
                  <Input.TextArea placeholder="Enter your full address" rows={3} />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    loading={loading.register}
                    disabled={loading.register}
                  >
                    Register
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </Drawer>

        {/* Owner Drawer */}
        <Drawer
          title="Owner"
          width={320}
          closable={true}
          onClose={onOwnerDrawerClose}
          open={ownerDrawer}
          destroyOnClose
           style={{ zIndex: 1001 }}
        >
          <Tabs
            defaultActiveKey="1"
            activeKey={activeTab}
            onChange={onTabChange}
            centered
          >
            <TabPane tab="Sign In" key="1">
              <Form
                form={ownerLoginForm}
                name="owner_signin"
                onFinish={onOwnerFinishSignIn}
                layout="vertical"
                initialValues={{ remember: true }}
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your email!' 
                    },
                    { 
                      type: 'email', 
                      message: 'Please enter a valid email!' 
                    },
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input 
                    placeholder="Enter your email" 
                    autoComplete="email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your password!' 
                    },
                    {
                      min: 6,
                      message: 'Password must be at least 6 characters!',
                    },
                  ]}
                >
                  <Input.Password 
                    placeholder="Enter your password" 
                    autoComplete="current-password"
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block
                    loading={loading.owner}
                    disabled={loading.owner}
                  >
                    Sign In
                  </Button>
                </Form.Item>
                <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 8 }}>
                  <Link href="/forgot-password" style={{ fontSize: 13 }}>Forgot password?</Link>
                </div>
              </Form>
            </TabPane>

            <TabPane tab="Register" key="2">
              <Form
                form={ownerRegisterForm}
                name="owner_register"
                onFinish={onOwnerRegister}
                layout="vertical"
                scrollToFirstError
              >
                <Form.Item
                  name="owner_name"
                  label="Full Name"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your name!',
                      whitespace: true 
                    },
                    {
                      min: 3,
                      message: 'Name must be at least 3 characters!',
                    },
                  ]}
                >
                  <Input placeholder="Enter your full name" />
                </Form.Item>
                
                <Form.Item
                  name="address"
                  label="Address"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your address!',
                      whitespace: true 
                    },
                    {
                      min: 1,
                      message: 'Address must be at least 1 characters!',
                    },
                  ]}
                >
                  <Input.TextArea placeholder="Enter your full address" rows={3} />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your email!' 
                    },
                    { 
                      type: 'email', 
                      message: 'Please enter a valid email!' 
                    },
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input placeholder="Enter your email" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your password!' 
                    },
                    { 
                      min: 6, 
                      message: 'Password must be at least 6 characters!' 
                    },
                  ]}
                  hasFeedback
                >
                  <Input.Password placeholder="Enter your password" />
                </Form.Item>

                <Form.Item
                  name="confirm"
                  label="Confirm Password"
                  dependencies={['password']}
                  hasFeedback
                  rules={[
                    {
                      required: true,
                      message: 'Please confirm your password!',
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The two passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm your password" />
                </Form.Item>
                
                <Form.Item
                  name="contact"
                  label="Contact Number"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your contact number!' 
                    },
                    {
                      pattern: /^[0-9]{10,15}$/,
                      message: 'Please enter a valid phone number!',
                    },
                  ]}
                >
                  <Input placeholder="Enter your contact number" />
                </Form.Item>
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    loading={loading.register}
                    disabled={loading.register}
                  >
                    Register
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </Drawer>

        {/* Admin Drawer */}
        <Drawer
          title="Admin"
          width={320}
          closable={true}
          onClose={onAdminDrawerClose}
          open={adminDrawer}
          destroyOnClose
           style={{ zIndex: 1001 }}
        >
          <Tabs
            defaultActiveKey="1"
            activeKey={activeTab}
            onChange={onTabChange}
            centered
          >
            <TabPane tab="Sign In" key="1">
              <Form
                form={adminLoginForm}
                name="admin_signin"
                onFinish={onAdminFinishSignIn}
                layout="vertical"
                initialValues={{ remember: true }}
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your email!' 
                    },
                    { 
                      type: 'email', 
                      message: 'Please enter a valid email!' 
                    },
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input 
                    placeholder="Enter your email" 
                    autoComplete="email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your password!' 
                    },
                    {
                      min: 6,
                      message: 'Password must be at least 6 characters!',
                    },
                  ]}
                >
                  <Input.Password 
                    placeholder="Enter your password" 
                    autoComplete="current-password"
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block
                    loading={loading.admin}
                    disabled={loading.admin}
                  >
                    Sign In
                  </Button>
                </Form.Item>
                <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 8 }}>
                  <Link href="/forgot-password" style={{ fontSize: 13 }}>Forgot password?</Link>
                </div>
              </Form>
            </TabPane>

            <TabPane tab="Register" key="2">
              <Form
                form={adminRegisterForm}
                name="admin_register"
                onFinish={onAdminRegister}
                layout="vertical"
                scrollToFirstError
              >
                <Form.Item
                  name="admin_name"
                  label="Full Name"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your name!',
                      whitespace: true 
                    },
                    {
                      min: 3,
                      message: 'Name must be at least 3 characters!',
                    },
                  ]}
                >
                  <Input placeholder="Enter your full name" />
                </Form.Item>
                
                <Form.Item
                  name="contact"
                  label="Contact Number"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your contact number!' 
                    },
                    {
                      pattern: /^[0-9]{10,15}$/,
                      message: 'Please enter a valid phone number!',
                    },
                  ]}
                >
                  <Input placeholder="Enter your contact number" />
                </Form.Item>

                <Form.Item
                  name="address"
                  label="Address"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your address!',
                      whitespace: true 
                    },
                    {
                      min: 2,
                      message: 'Address must be at least 2 characters!',
                    },
                  ]}
                >
                  <Input.TextArea placeholder="Enter your full address" rows={2} />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your email!' 
                    },
                    { 
                      type: 'email', 
                      message: 'Please enter a valid email!' 
                    },
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input placeholder="Enter your email" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { 
                      required: true, 
                      message: 'Please input your password!' 
                    },
                    { 
                      min: 6, 
                      message: 'Password must be at least 6 characters!' 
                    },
                  ]}
                  hasFeedback
                >
                  <Input.Password placeholder="Enter your password" />
                </Form.Item>

                <Form.Item
                  name="confirm"
                  label="Confirm Password"
                  dependencies={['password']}
                  hasFeedback
                  rules={[
                    {
                      required: true,
                      message: 'Please confirm your password!',
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The two passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm your password" />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    loading={loading.register}
                    disabled={loading.register}
                  >
                    Register
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </Drawer>
      </Drawer>
    </div>
  );
};

export default LogInAs;