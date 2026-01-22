import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Form, Button, Row, Col, Modal } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import {
  login,
  register,
  checkEmailExists,
  loginWithPasswordFromApi,
} from '../actions/userActions'

const LoginScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [passwordModal, setPasswordModal] = useState('')
  const [googleUser, setGoogleUser] = useState(null)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const redirect = location.search
    ? location.search.split('=')[1]
    : '/'

  const userLogin = useSelector((state) => state.userLogin)
  const { loading, error, userInfo } = userLogin

  useEffect(() => {
    if (userInfo) navigate(redirect)
  }, [userInfo, navigate, redirect])

  /* =========================
     GOOGLE HANDLER (CHUNG)
  ========================= */
  const handleGoogleCredential = async (credential) => {
    try {
      const decoded = jwtDecode(credential)
      const { email, name } = decoded

      const existsRes = await dispatch(checkEmailExists(email))

      if (existsRes?.exists) {
        // ✅ ĐÃ CÓ TÀI KHOẢN → LOGIN BẰNG PASS TỪ API
        dispatch(loginWithPasswordFromApi(email))
      } else {
        // 🆕 CHƯA CÓ → MODAL NHẬP PASSWORD
        setGoogleUser({ email, name })
        setShowModal(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  /* =========================
     GOOGLE ONE TAP
  ========================= */
  useGoogleOneTapLogin({
    disabled: !!userInfo,
    onSuccess: (res) => handleGoogleCredential(res.credential),
  })

  /* =========================
     GOOGLE BUTTON
  ========================= */
  const handleGoogleLoginSuccess = (res) => {
    if (res?.credential) handleGoogleCredential(res.credential)
  }

  /* =========================
     REGISTER FROM MODAL
  ========================= */
  const handleModalSubmit = async () => {
    if (!googleUser || !passwordModal) return

    await dispatch(
      register(
        googleUser.name,
        googleUser.email,
        passwordModal,
        'buyer'
      )
    )

    dispatch(login(googleUser.email, passwordModal))
    setShowModal(false)
    setPasswordModal('')
  }

  /* =========================
     NORMAL LOGIN
  ========================= */
  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(login(email, password))
  }

  return (
    <FormContainer>
      <h1>Sign In</h1>

      {error && <Message variant="danger">{error}</Message>}
      {loading && <Loader />}

      <div className="mb-3 text-center">
        <GoogleLogin
          onSuccess={handleGoogleLoginSuccess}
          onError={() => console.log('Google Login Failed')}
        />
      </div>

      <Form onSubmit={submitHandler}>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        <Button type="submit">Login</Button>
      </Form>

      <Row className="py-3">
        <Col>
          New Customer? <Link to="/register">Register</Link>
        </Col>
      </Row>

      {/* GOOGLE REGISTER MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Please enter a password to create your account <strong>{googleUser?.email}</strong>.
          </p>
          <Form.Control
            type="password"
            placeholder="Set password"
            value={passwordModal}
            onChange={(e) => setPasswordModal(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleModalSubmit}>
            Register & Login
          </Button>
        </Modal.Footer>
      </Modal>
    </FormContainer>
  )
}

export default LoginScreen
