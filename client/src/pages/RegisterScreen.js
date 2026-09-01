import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Row, Col, Modal, Alert, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

import Message from '../components/Message';
import FormContainer from '../components/FormContainer';
import { checkEmailExists, googleLoginDirect } from '../actions/userActions';
import { USER_LOGIN_SUCCESS } from '../constants/userConstants';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [paypalClientId, setPaypalClientId] = useState(''); 
  
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState('');
  const [googleUser, setGoogleUser] = useState(null);
  
  // Thêm state lưu Role và PayPal Client ID riêng cho Modal Google (có thể lấy mặc định theo form chính)
  const [googleRole, setGoogleRole] = useState('buyer');
  const [googlePaypalClientId, setGooglePaypalClientId] = useState('');

  // STATE OTP
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // STATE CHO TÍNH NĂNG NHẬP EMAIL ĐỂ VERIFY THỦ CÔNG
  const [showManualVerifyModal, setShowManualVerifyModal] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = new URLSearchParams(location.search).get('redirect') || '/';
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin; 

  useEffect(() => {
    if (userInfo) navigate(redirect);
  }, [userInfo, navigate, redirect]);

  const handleGoogleCredential = async (credential) => {
    const decoded = jwtDecode(credential);
    const { email, name } = decoded;
    const existsRes = await dispatch(checkEmailExists(email));
    if (existsRes?.exists) {
      dispatch(googleLoginDirect(email));
    } else {
      setGoogleUser({ email, name });
      // Đồng bộ giá trị hiện tại ở form chính vào modal Google nếu muốn
      setGoogleRole(role);
      setGooglePaypalClientId(paypalClientId);
      setShowGoogleModal(true);
    }
  };

  useGoogleOneTapLogin({ disabled: !!userInfo, onSuccess: (res) => handleGoogleCredential(res.credential) });
  const handleGoogleLoginSuccess = (res) => { if (res?.credential) handleGoogleCredential(res.credential) };

  const handleGoogleModalSubmit = async () => {
    if (!googleUser || !passwordModal) return;
    try {
      setIsRegistering(true);
      const config = { headers: { 'Content-Type': 'application/json' } };
      const { data } = await axios.post('/api/users', { 
        name: googleUser.name, 
        email: googleUser.email, 
        password: passwordModal, 
        role: googleRole,              // Lấy từ state modal Google
        paypalClientId: googlePaypalClientId, // Lấy từ state modal Google
        isGoogleAuth: true
      }, config);
      
      dispatch({ type: USER_LOGIN_SUCCESS, payload: data });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setShowGoogleModal(false);
      navigate(redirect);
    } catch (error) {
       console.log(error);
    } finally { setIsRegistering(false); }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setOtpError('Mật khẩu xác nhận không khớp'); return;
    }
    setOtpError('');
    try {
      setIsRegistering(true);
      const config = { headers: { 'Content-Type': 'application/json' } };
      await axios.post('/api/users', { name, email, password, role, paypalClientId }, config);
      
      setIsRegistering(false);
      setShowOtpModal(true);
    } catch (error) {
      setIsRegistering(false);
      setOtpError(error.response?.data?.message || error.message);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setIsVerifying(true); setOtpError(''); setOtpMessage('');
      const config = { headers: { 'Content-Type': 'application/json' } };
      const { data } = await axios.post('/api/users/verify-otp', { email, otp: otpCode }, config);
      
      dispatch({ type: USER_LOGIN_SUCCESS, payload: data });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setShowOtpModal(false);
      navigate(redirect);
    } catch (error) {
      setIsVerifying(false);
      setOtpError(error.response?.data?.message || 'Mã OTP không hợp lệ');
    }
  };

  const handleResendOtp = async () => {
    try {
      setOtpError(''); setOtpMessage('');
      const config = { headers: { 'Content-Type': 'application/json' } };
      await axios.post('/api/users/resend-otp', { email }, config);
      setOtpMessage('Mã xác nhận mới đã được gửi vào email của bạn!');
    } catch (error) {
      setOtpError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi lại mã');
    }
  };

  const handleManualVerifySubmit = async (e) => {
    e.preventDefault();
    if (!manualEmail) return;
    try {
      setManualLoading(true); setManualError('');
      const config = { headers: { 'Content-Type': 'application/json' } };
      await axios.post('/api/users/resend-otp', { email: manualEmail }, config);
      
      setEmail(manualEmail);
      setManualLoading(false);
      setShowManualVerifyModal(false);
      setShowOtpModal(true);
      setOtpMessage(`Mã xác thực mới đã được gửi tới ${manualEmail}!`);
    } catch (error) {
      setManualLoading(false);
      setManualError(error.response?.data?.message || 'Không tìm thấy email hoặc có lỗi xảy ra');
    }
  };

  return (
    <FormContainer>
      <h1>Đăng Ký</h1>
      {otpError && !showOtpModal && <Message variant="danger">{otpError}</Message>}

      <div className="mb-3 text-center">
        <GoogleLogin onSuccess={handleGoogleLoginSuccess} onError={() => console.log('Google Login Failed')} />
      </div>

      <Form onSubmit={submitHandler}>
        <Form.Control className="mb-2" placeholder="Tên của bạn" value={name} onChange={(e) => setName(e.target.value)} required />
        <Form.Control className="mb-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Form.Control className="mb-2" type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Form.Control className="mb-3" type="password" placeholder="Xác nhận mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /> 
        
        <Form.Group className="mb-3">
          <Form.Control as="select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="buyer">Buyer (Người mua)</option>
            <option value="seller">Seller (Người bán)</option>
          </Form.Control>
        </Form.Group>

        <Form.Control className="mb-3" type="text" placeholder="PayPal Client ID (Tùy chọn)" value={paypalClientId} onChange={(e) => setPaypalClientId(e.target.value)} />
        <Button type="submit" disabled={isRegistering}>
          {isRegistering ? <><Spinner as="span" animation="border" size="sm" /> Đang xử lý...</> : 'Đăng ký'}
        </Button>
      </Form>

      <Row className="py-3 d-flex justify-content-between align-items-center">
        <Col xs={7}>Đã có tài khoản? <Link to="/login" className="fw-bold text-primary text-decoration-none">Đăng nhập</Link></Col>
        <Col xs={5} className="text-end">
          <Button
            variant="link"
            className="p-0 text-decoration-none fw-bold"
            style={{ color: '#0d6efd' }}
            onClick={() => setShowManualVerifyModal(true)}
          >
            Nhập mã xác thực?
          </Button>
        </Col>
      </Row>

      {/* ================= MODAL NHẬP OTP ================= */}
      <Modal show={showOtpModal} onHide={() => setShowOtpModal(false)} backdrop={true} keyboard={true} centered>
        <Modal.Header>
          <Modal.Title className="w-100 text-center fw-bold">Xác thực Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {otpError && <Alert variant="danger">{otpError}</Alert>}
          {otpMessage && <Alert variant="success">{otpMessage}</Alert>}
          <p>Mã xác thực gồm 6 chữ số đã được gửi đến: <strong>{email}</strong></p>
          <Form.Control type="text" placeholder="Nhập mã OTP (VD: 123456)" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="outline-primary" onClick={handleResendOtp}>Gửi lại mã</Button>
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={() => setShowOtpModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleVerifyOtp} disabled={!otpCode || isVerifying}>
              {isVerifying ? 'Đang xác thực...' : 'Xác nhận'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* ================= MODAL NHẬP EMAIL THỦ CÔNG ================= */}
      <Modal show={showManualVerifyModal} onHide={() => setShowManualVerifyModal(false)} backdrop={true} keyboard={true} centered>
        <Modal.Header>
          <Modal.Title className="w-100 text-center fw-bold">Xác thực tài khoản bằng Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {manualError && <Alert variant="danger">{manualError}</Alert>}
          <p>Nhập email tài khoản bạn đã đăng ký để nhận lại mã xác thực OTP mới:</p>
          <Form onSubmit={handleManualVerifySubmit}>
            <Form.Control 
              type="email" 
              placeholder="Nhập địa chỉ email của bạn..." 
              value={manualEmail} 
              onChange={(e) => setManualEmail(e.target.value)} 
              required 
            />
          </Form>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={() => setShowManualVerifyModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleManualVerifySubmit} disabled={!manualEmail || manualLoading}>
            {manualLoading ? 'Đang gửi...' : 'Gửi mã xác thực'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL GOOGLE - ĐÃ THÊM FORM CHỌN ROLE VÀ PAYPAL CLIENT ID */}
      <Modal show={showGoogleModal} onHide={() => setShowGoogleModal(false)} backdrop={true} keyboard={true} centered>
        <Modal.Header>
          <Modal.Title className="w-100 text-center fw-bold">Tạo tài khoản Google</Modal.Title>
        </Modal.Header>
        <Modal.Body>
           <p className="mb-2">Vui lòng hoàn tất thông tin cho tài khoản <strong>{googleUser?.email}</strong>.</p>
           
           <Form.Control 
             className="mb-2" 
             type="password" 
             placeholder="Mật khẩu" 
             value={passwordModal} 
             onChange={(e) => setPasswordModal(e.target.value)} 
             required 
           />

           <Form.Group className="mb-2">
             <Form.Control as="select" value={googleRole} onChange={(e) => setGoogleRole(e.target.value)}>
               <option value="buyer">Buyer (Người mua)</option>
               <option value="seller">Seller (Người bán)</option>
             </Form.Control>
           </Form.Group>

           <Form.Control 
             className="mb-2" 
             type="text" 
             placeholder="PayPal Client ID (Tùy chọn)" 
             value={googlePaypalClientId} 
             onChange={(e) => setGooglePaypalClientId(e.target.value)} 
           />
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={() => setShowGoogleModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleGoogleModalSubmit} disabled={!passwordModal || isRegistering}>
            {isRegistering ? 'Đang xử lý...' : 'Hoàn tất'}
          </Button>
        </Modal.Footer>
      </Modal>

    </FormContainer>
  );
};

export default RegisterScreen;