import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Message from '../components/Message';

const DiscountCreateScreen = () => {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [discountType, setDiscountType] = useState('percent'); // THÊM STATE CHO LOẠI GIẢM GIÁ
  const [assignType, setAssignType] = useState('all'); 
  const [email, setEmail] = useState(''); 
  
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      // Thêm discountType vào payload
      const payload = {
        code,
        description,
        amount: Number(amount),
        discountType, // Gửi loại giảm giá lên server
        email: assignType === 'specific' ? email : null,
      };

      await axios.post('/api/discounts/create', payload, config);
      setMessage('Tạo mã giảm giá thành công!');
      setError(null);
      
      // Reset form
      setCode('');
      setDescription('');
      setAmount('');
      setDiscountType('percent');
      setEmail('');
      setAssignType('all');

    } catch (err) {
      setError(err.response && err.response.data.message ? err.response.data.message : err.message);
      setMessage(null);
    }
  };

  return (
    <div>
      <h1>Tạo Mã Giảm Giá</h1>
      {message && <Message variant="success">{message}</Message>}
      {error && <Message variant="danger">{error}</Message>}

      <Form onSubmit={submitHandler}>
        <Form.Group controlId="code" className="mb-3">
          <Form.Label>Mã Giảm Giá (VD: TET2026)</Form.Label>
          <Form.Control 
            type="text" 
            value={code} 
            onChange={(e) => setCode(e.target.value)} 
            required 
          />
        </Form.Group>

        <Form.Group controlId="description" className="mb-3">
          <Form.Label>Mô Tả</Form.Label>
          <Form.Control 
            type="text" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
          />
        </Form.Group>

        <Form.Group controlId="discountType" className="mb-3">
          <Form.Label>Loại giảm giá</Form.Label>
          <Form.Control as="select" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
            <option value="percent">Giảm theo phần trăm (%)</option>
            <option value="fixed">Giảm số tiền cụ thể (USD)</option>
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="amount" className="mb-3">
          {/* Đổi Label dựa theo loại giảm giá */}
          <Form.Label>{discountType === 'percent' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (USD)'}</Form.Label>
          <Form.Control 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
          />
        </Form.Group>

        <Form.Group controlId="assignType" className="mb-3">
          <Form.Label>Áp dụng cho</Form.Label>
          <Form.Control as="select" value={assignType} onChange={(e) => setAssignType(e.target.value)}>
            <option value="all">Tất cả mọi người</option>
            <option value="specific">Một người dùng cụ thể</option>
          </Form.Control>
        </Form.Group>

        {assignType === 'specific' && (
          <Form.Group controlId="email" className="mb-3">
            <Form.Label>Nhập Email người dùng</Form.Label>
            <Form.Control 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Nhập email người dùng" 
              required 
            />
          </Form.Group>
        )}

        <Button type="submit" variant="primary">Tạo Mã</Button>
      </Form>
    </div>
  );
};

export default DiscountCreateScreen;