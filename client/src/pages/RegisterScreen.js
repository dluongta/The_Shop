import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom' // Import useNavigate and useLocation
import { Form, Button, Row, Col } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import { register } from '../actions/userActions'

const RegisterScreen = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('buyer') // New state for role
  const [message, setMessage] = useState(null)

  const dispatch = useDispatch()
  const navigate = useNavigate() // Initialize useNavigate
  const location = useLocation() // Initialize useLocation

  const userRegister = useSelector((state) => state.userRegister)
  const { loading, error, userInfo } = userRegister

  // Get redirect from location.search query parameter
  const redirect = new URLSearchParams(location.search).get('redirect') || '/'

  useEffect(() => {
    if (userInfo) {
      navigate(redirect) // Use navigate to redirect if user is already logged in
    }
  }, [userInfo, redirect, navigate]) // Include navigate in dependency array

  const submitHandler = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
    } else {
      dispatch(register(name, email, password, role)) // Pass the role
    }
  }

  return (
    <FormContainer>
      <h1>Sign Up</h1>
      {message && <Message variant='danger'>{message}</Message>}
      {error && <Message variant='danger'>{error}</Message>}
      {loading && <Loader />}
      <Form onSubmit={submitHandler}>
        <Form.Group controlId='name'>
          <Form.Label>Name</Form.Label>
          <Form.Control
            type='name'
            placeholder='Enter name'
            value={name}
            onChange={(e) => setName(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId='email'>
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type='email'
            placeholder='Enter email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId='password'>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type='password'
            placeholder='Enter password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId='confirmPassword'>
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type='password'
            placeholder='Confirm password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          ></Form.Control>
        </Form.Group>

        {/* Add Role Dropdown */}
        <Form.Group controlId='role'>
          <Form.Label>Role</Form.Label>
          <Form.Control
            as='select'
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value='buyer'>Buyer</option>
            <option value='seller'>Seller</option>
          </Form.Control>
        </Form.Group>

        <Button type='submit' variant='primary' className='mt-3'>
          Register
        </Button>
      </Form>

      <Row className='py-3'>
        <Col>
          Have an Account?{' '}
          <Link to={redirect ? `/login?redirect=${redirect}` : '/login'}>
            Login
          </Link>
        </Col>
      </Row>
    </FormContainer>
  )
}

export default RegisterScreen
