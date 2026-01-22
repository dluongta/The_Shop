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

const RegisterScreen = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [passwordModal, setPasswordModal] = useState('')
  const [googleUser, setGoogleUser] = useState(null)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const redirect = new URLSearchParams(location.search).get('redirect') || '/'

  const userRegister = useSelector((state) => state.userRegister)
  const { loading, error, userInfo } = userRegister

  useEffect(() => {
    if (userInfo) navigate(redirect)
  }, [userInfo, navigate, redirect])

  /* =========================
     GOOGLE HANDLER
  ========================= */
  const handleGoogleCredential = async (credential) => {
    const decoded = jwtDecode(credential)
    const { email, name } = decoded

    const existsRes = await dispatch(checkEmailExists(email))

    if (existsRes?.exists) {
      dispatch(loginWithPasswordFromApi(email))
    } else {
      setGoogleUser({ email, name })
      setShowModal(true)
    }
  }

  useGoogleOneTapLogin({
    disabled: !!userInfo,
    onSuccess: (res) => handleGoogleCredential(res.credential),
  })

  const handleGoogleLoginSuccess = (res) => {
    if (res?.credential) handleGoogleCredential(res.credential)
  }

  /* =========================
     MODAL REGISTER
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
  }

  /* =========================
     NORMAL REGISTER
  ========================= */
  const submitHandler = (e) => {
    e.preventDefault()

    if (password !== confirmPassword) return
    dispatch(register(name, email, password, 'buyer'))
  }

  return (
    <FormContainer>
      <h1>Register</h1>

      {error && <Message variant="danger">{error}</Message>}
      {loading && <Loader />}

      <div className="mb-3 text-center">
        <GoogleLogin
          onSuccess={handleGoogleLoginSuccess}
          onError={() => console.log('Google Login Failed')}
        />
      </div>

      <Form onSubmit={submitHandler}>
        <Form.Control
          className="mb-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Form.Control
          className="mb-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Form.Control
          className="mb-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Form.Control
          className="mb-3"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button type="submit">Register</Button>
      </Form>

      <Row className="py-3">
        <Col>
          Already have account? <Link to="/login">Login</Link>
        </Col>
      </Row>

      {/* GOOGLE REGISTER MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
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

export default RegisterScreen
