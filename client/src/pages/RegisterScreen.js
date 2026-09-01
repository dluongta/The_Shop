import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Form,
  Button,
  Row,
  Col,
  Modal,
  Alert,
  Spinner,
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import {
  GoogleLogin,
  useGoogleOneTapLogin,
} from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

import Message from '../components/Message';
import FormContainer from '../components/FormContainer';
import {
  checkEmailExists,
  googleLoginDirect,
} from '../actions/userActions';
import { USER_LOGIN_SUCCESS } from '../constants/userConstants';

const RegisterScreen = () => {
  // ================= REGISTER STATE =================
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [paypalClientId, setPaypalClientId] = useState('');

  // ================= GOOGLE STATE =================
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState('');
  const [googleUser, setGoogleUser] = useState(null);
  const [googleError, setGoogleError] = useState('');

  // ================= OTP STATE =================
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // ================= MANUAL VERIFY STATE =================
  const [showManualVerifyModal, setShowManualVerifyModal] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const redirect =
    new URLSearchParams(location.search).get('redirect') || '/';

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  // ================= REDIRECT =================
  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [userInfo, navigate, redirect]);

  // =========================================================
  // GOOGLE LOGIN
  // =========================================================

  const handleGoogleCredential = async (credential) => {
    try {
      const decoded = jwtDecode(credential);

      const googleEmail = decoded.email;
      const googleName = decoded.name;

      if (!googleEmail) {
        setGoogleError('Không lấy được email từ tài khoản Google.');
        return;
      }

      // Kiểm tra email đã tồn tại chưa
      const existsRes = await dispatch(
        checkEmailExists(googleEmail)
      );

      if (existsRes?.exists) {
        // Email đã tồn tại -> đăng nhập Google trực tiếp
        dispatch(googleLoginDirect(googleEmail));
      } else {
        // Email chưa tồn tại -> mở modal tạo tài khoản
        setGoogleUser({
          email: googleEmail,
          name: googleName,
        });

        // Reset dữ liệu Google modal
        setPasswordModal('');
        setRole('buyer');
        setPaypalClientId('');
        setGoogleError('');

        setShowGoogleModal(true);
      }
    } catch (error) {
      console.error('Google credential error:', error);
      setGoogleError(
        error.response?.data?.message ||
          'Đăng nhập bằng Google thất bại.'
      );
    }
  };

  useGoogleOneTapLogin({
    disabled: !!userInfo,
    onSuccess: (res) => {
      if (res?.credential) {
        handleGoogleCredential(res.credential);
      }
    },
  });

  const handleGoogleLoginSuccess = (res) => {
    if (res?.credential) {
      handleGoogleCredential(res.credential);
    }
  };

  // =========================================================
  // GOOGLE REGISTER SUBMIT
  // =========================================================

  const handleGoogleModalSubmit = async (e) => {
    e.preventDefault();

    setGoogleError('');

    // Kiểm tra dữ liệu
    if (!googleUser) {
      setGoogleError('Không tìm thấy thông tin tài khoản Google.');
      return;
    }

    if (!passwordModal) {
      setGoogleError('Vui lòng nhập mật khẩu.');
      return;
    }

    if (passwordModal.length < 6) {
      setGoogleError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (!role) {
      setGoogleError('Vui lòng chọn Role.');
      return;
    }

    try {
      setIsRegistering(true);

      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const { data } = await axios.post(
        '/api/users',
        {
          name: googleUser.name,
          email: googleUser.email,
          password: passwordModal,

          // Role được chọn trong Google Modal
          role: role,

          // PayPal Client ID có thể rỗng
          paypalClientId: paypalClientId.trim(),

          // Đánh dấu đăng ký bằng Google
          isGoogleAuth: true,
        },
        config
      );

      // Login ngay sau khi tạo tài khoản
      dispatch({
        type: USER_LOGIN_SUCCESS,
        payload: data,
      });

      localStorage.setItem(
        'userInfo',
        JSON.stringify(data)
      );

      // Đóng modal
      setShowGoogleModal(false);

      // Reset Google state
      setGoogleUser(null);
      setPasswordModal('');
      setRole('buyer');
      setPaypalClientId('');
      setGoogleError('');

      // Chuyển trang
      navigate(redirect);
    } catch (error) {
      console.error('Google register error:', error);

      setGoogleError(
        error.response?.data?.message ||
          error.message ||
          'Không thể tạo tài khoản.'
      );
    } finally {
      setIsRegistering(false);
    }
  };

  // =========================================================
  // NORMAL REGISTER
  // =========================================================

  const submitHandler = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setOtpError('Mật khẩu xác nhận không khớp');
      return;
    }

    setOtpError('');

    try {
      setIsRegistering(true);

      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      await axios.post(
        '/api/users',
        {
          name,
          email,
          password,
          role,
          paypalClientId,
        },
        config
      );

      setIsRegistering(false);

      // Hiện modal OTP
      setOtpCode('');
      setOtpError('');
      setOtpMessage('');
      setShowOtpModal(true);
    } catch (error) {
      setIsRegistering(false);

      setOtpError(
        error.response?.data?.message ||
          error.message
      );
    }
  };

  // =========================================================
  // VERIFY OTP
  // =========================================================

  const handleVerifyOtp = async () => {
    try {
      setIsVerifying(true);
      setOtpError('');
      setOtpMessage('');

      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const { data } = await axios.post(
        '/api/users/verify-otp',
        {
          email,
          otp: otpCode,
        },
        config
      );

      dispatch({
        type: USER_LOGIN_SUCCESS,
        payload: data,
      });

      localStorage.setItem(
        'userInfo',
        JSON.stringify(data)
      );

      setShowOtpModal(false);

      setOtpCode('');
      setOtpError('');
      setOtpMessage('');

      navigate(redirect);
    } catch (error) {
      setIsVerifying(false);

      setOtpError(
        error.response?.data?.message ||
          'Mã OTP không hợp lệ'
      );
    }
  };

  // =========================================================
  // RESEND OTP
  // =========================================================

  const handleResendOtp = async () => {
    try {
      setOtpError('');
      setOtpMessage('');

      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      await axios.post(
        '/api/users/resend-otp',
        { email },
        config
      );

      setOtpMessage(
        'Mã xác nhận mới đã được gửi vào email của bạn!'
      );
    } catch (error) {
      setOtpError(
        error.response?.data?.message ||
          'Có lỗi xảy ra khi gửi lại mã'
      );
    }
  };

  // =========================================================
  // MANUAL VERIFY
  // =========================================================

  const handleManualVerifySubmit = async (e) => {
    e.preventDefault();

    if (!manualEmail) return;

    try {
      setManualLoading(true);
      setManualError('');

      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      await axios.post(
        '/api/users/resend-otp',
        { email: manualEmail },
        config
      );

      setEmail(manualEmail);

      setManualLoading(false);
      setShowManualVerifyModal(false);

      setOtpCode('');
      setOtpError('');
      setOtpMessage(
        `Mã xác thực mới đã được gửi tới ${manualEmail}!`
      );

      setShowOtpModal(true);
    } catch (error) {
      setManualLoading(false);

      setManualError(
        error.response?.data?.message ||
          'Không tìm thấy email hoặc có lỗi xảy ra'
      );
    }
  };

  // =========================================================
  // CLOSE GOOGLE MODAL
  // =========================================================

  const handleCloseGoogleModal = () => {
    if (isRegistering) return;

    setShowGoogleModal(false);
    setGoogleUser(null);
    setPasswordModal('');
    setRole('buyer');
    setPaypalClientId('');
    setGoogleError('');
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <FormContainer>
      <h1>Đăng Ký</h1>

      {otpError && !showOtpModal && (
        <Message variant="danger">
          {otpError}
        </Message>
      )}

      {/* ================= GOOGLE LOGIN ================= */}
      <div className="mb-3 text-center">
        <GoogleLogin
          onSuccess={handleGoogleLoginSuccess}
          onError={() =>
            console.log('Google Login Failed')
          }
        />
      </div>

      {/* ================= NORMAL REGISTER ================= */}
      <Form onSubmit={submitHandler}>
        <Form.Control
          className="mb-2"
          placeholder="Tên của bạn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Form.Control
          className="mb-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Form.Control
          className="mb-2"
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Form.Control
          className="mb-3"
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(e.target.value)
          }
          required
        />

        {/* ROLE */}
        <Form.Group className="mb-3">
          <Form.Label>Role</Form.Label>

          <Form.Control
            as="select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="buyer">
              Buyer (Người mua)
            </option>

            <option value="seller">
              Seller (Người bán)
            </option>
          </Form.Control>
        </Form.Group>

        {/* PAYPAL */}
        <Form.Control
          className="mb-3"
          type="text"
          placeholder="PayPal Client ID (Tùy chọn)"
          value={paypalClientId}
          onChange={(e) =>
            setPaypalClientId(e.target.value)
          }
        />

        <Button
          type="submit"
          disabled={isRegistering}
        >
          {isRegistering ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                className="me-2"
              />
              Đang xử lý...
            </>
          ) : (
            'Đăng ký'
          )}
        </Button>
      </Form>

      {/* ================= BOTTOM ================= */}
      <Row className="py-3 d-flex justify-content-between align-items-center">
        <Col xs={7}>
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="fw-bold text-primary text-decoration-none"
          >
            Đăng nhập
          </Link>
        </Col>

        <Col xs={5} className="text-end">
          <Button
            variant="link"
            className="p-0 text-decoration-none fw-bold"
            style={{
              color: '#0d6efd',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0d6efd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#0d6efd';
            }}
            onClick={() =>
              setShowManualVerifyModal(true)
            }
          >
            Nhập mã xác thực?
          </Button>
        </Col>
      </Row>

      {/* =====================================================
          MODAL NHẬP OTP
      ===================================================== */}
      <Modal
        show={showOtpModal}
        onHide={() => setShowOtpModal(false)}
        backdrop={true}
        keyboard={true}
        centered
      >
        <Modal.Header>
          <Modal.Title className="w-100 text-center fw-bold">
            Xác thực Email
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {otpError && (
            <Alert variant="danger">
              {otpError}
            </Alert>
          )}

          {otpMessage && (
            <Alert variant="success">
              {otpMessage}
            </Alert>
          )}

          <p>
            Mã xác thực gồm 6 chữ số đã được gửi đến:{' '}
            <strong>{email}</strong>
          </p>

          <Form.Control
            type="text"
            placeholder="Nhập mã OTP (VD: 123456)"
            value={otpCode}
            onChange={(e) =>
              setOtpCode(e.target.value)
            }
            maxLength={6}
          />
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="outline-primary"
            onClick={handleResendOtp}
          >
            Gửi lại mã
          </Button>

          <div className="d-flex gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                setShowOtpModal(false)
              }
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={handleVerifyOtp}
              disabled={
                !otpCode || isVerifying
              }
            >
              {isVerifying
                ? 'Đang xác thực...'
                : 'Xác nhận'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* =====================================================
          MODAL NHẬP EMAIL THỦ CÔNG
      ===================================================== */}
      <Modal
        show={showManualVerifyModal}
        onHide={() =>
          setShowManualVerifyModal(false)
        }
        backdrop={true}
        keyboard={true}
        centered
      >
        <Modal.Header>
          <Modal.Title className="w-100 text-center fw-bold">
            Xác thực tài khoản bằng Email
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {manualError && (
            <Alert variant="danger">
              {manualError}
            </Alert>
          )}

          <p>
            Nhập email tài khoản bạn đã đăng ký để
            nhận lại mã xác thực OTP mới:
          </p>

          <Form
            onSubmit={handleManualVerifySubmit}
          >
            <Form.Control
              type="email"
              placeholder="Nhập địa chỉ email của bạn..."
              value={manualEmail}
              onChange={(e) =>
                setManualEmail(e.target.value)
              }
              required
            />
          </Form>
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-end gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              setShowManualVerifyModal(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={handleManualVerifySubmit}
            disabled={
              !manualEmail || manualLoading
            }
          >
            {manualLoading
              ? 'Đang gửi...'
              : 'Gửi mã xác thực'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* =====================================================
          GOOGLE REGISTER MODAL
      ===================================================== */}
      <Modal
        show={showGoogleModal}
        onHide={handleCloseGoogleModal}
        backdrop={true}
        keyboard={!isRegistering}
        centered
      >
        <Modal.Header>
          <Modal.Title className="w-100 text-center fw-bold">
            Tạo tài khoản bằng Google
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleGoogleModalSubmit}>
          <Modal.Body>
            {/* ERROR */}
            {googleError && (
              <Alert variant="danger">
                {googleError}
              </Alert>
            )}

            {/* GOOGLE EMAIL */}
            <Form.Group className="mb-3">
              <Form.Label>
                Email Google
              </Form.Label>

              <Form.Control
                type="email"
                value={googleUser?.email || ''}
                disabled
              />
            </Form.Group>

            {/* GOOGLE NAME */}
            <Form.Group className="mb-3">
              <Form.Label>
                Họ và tên
              </Form.Label>

              <Form.Control
                type="text"
                value={googleUser?.name || ''}
                disabled
              />
            </Form.Group>

            {/* PASSWORD */}
            <Form.Group className="mb-3">
              <Form.Label>
                Mật khẩu <span className="text-danger">*</span>
              </Form.Label>

              <Form.Control
                type="password"
                placeholder="Nhập mật khẩu"
                value={passwordModal}
                onChange={(e) =>
                  setPasswordModal(e.target.value)
                }
                minLength={6}
                required
              />

              <Form.Text className="text-muted">
                Mật khẩu phải có ít nhất 6 ký tự.
              </Form.Text>
            </Form.Group>

            {/* ROLE */}
            <Form.Group className="mb-3">
              <Form.Label>
                Role <span className="text-danger">*</span>
              </Form.Label>

              <Form.Control
                as="select"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
                required
              >
                <option value="buyer">
                  Buyer (Người mua)
                </option>

                <option value="seller">
                  Seller (Người bán)
                </option>
              </Form.Control>
            </Form.Group>

            {/* PAYPAL CLIENT ID */}
            <Form.Group className="mb-3">
              <Form.Label>
                PayPal Client ID
                <span className="text-muted">
                  {' '}
                  (Tùy chọn)
                </span>
              </Form.Label>

              <Form.Control
                type="text"
                placeholder="Nhập PayPal Client ID nếu có..."
                value={paypalClientId}
                onChange={(e) =>
                  setPaypalClientId(e.target.value)
                }
              />

              <Form.Text className="text-muted">
                Bạn có thể bỏ trống trường này.
              </Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="d-flex justify-content-end gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={handleCloseGoogleModal}
              disabled={isRegistering}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              type="submit"
              disabled={
                isRegistering ||
                !passwordModal ||
                !role
              }
            >
              {isRegistering ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  Đang tạo tài khoản...
                </>
              ) : (
                'Hoàn tất đăng ký'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </FormContainer>
  );
};

export default RegisterScreen;
