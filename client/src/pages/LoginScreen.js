import React, { useState, useEffect } from 'react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom'; // useNavigate and useLocation hooks
import { Form, Button, Row, Col, Modal } from 'react-bootstrap'; // Import Modal
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import FormContainer from '../components/FormContainer';
import { login, register, checkEmailExists, getPasswordByEmail } from '../actions/userActions'; // Import actions
import { GoogleLogin } from '@react-oauth/google'; // Google Login
import { jwtDecode } from 'jwt-decode'; // Decode JWT Token for Google Login

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');  // To store name from Google login
  const [password, setPassword] = useState('');
  const [passwordModal, setPasswordModal] = useState('');
  const [showModal, setShowModal] = useState(false); // Modal state
  const [userData, setUserData] = useState(null); // Store user data (name, email from Google)

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userLogin = useSelector((state) => state.userLogin);
  const { loading, error, userInfo } = userLogin;

  const location = useLocation();
  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect); // Redirect after login
    }
  }, [navigate, userInfo, redirect]);

  // Separate the function that handles Google login
  const handleGoogleLoginSuccess = (credentialResponse) => {
    if (credentialResponse && credentialResponse.credential) {
      try {
        const decodedCredential = jwtDecode(credentialResponse.credential);
        const { email, name } = decodedCredential;

        // Set email and name in the state
        setEmail(email);
        setName(name);
        console.log('Email from Google:', email);
        
        // Now check if the email exists
        checkIfEmailExists(email);
      } catch (error) {
        console.error('Error during Google login success:', error);
      }
    }
  };
  const fetchPassword = async (email) => {
    try {
      const response = await fetch(`/api/users/password/${email}`);
      if (!response.ok) {
        throw new Error('User not found or failed to fetch password');
      }
      const data = await response.json();
      console.log(data); // This should give you the user object, including the password field (though again, check security concerns)
      return data.password;  // Return the password if needed (hashed password)
    } catch (error) {
      console.error('Error fetching password:', error);
      return null;  // Return null if there’s an error
    }
  };
  
  
  // Function to check if email exists in the database
  const checkIfEmailExists = async (email) => {
    try {
      const response = await dispatch(checkEmailExists(email));
      console.log('Email check response:', response); // Log response for debugging

      if (response && response.exists) {
        // If email exists, get password from API and log in
        const passwordResponse = await fetchPassword(email);
        console.log(passwordResponse)
        dispatch(login(email, passwordResponse)); // Dispatch login with the password
      } else {
        setUserData({ email, name }); // Set user data for registration modal
        setShowModal(true); // Show the modal for password input
      }
    } catch (error) {
      console.error('Error checking email existence:', error);
    }
  };

  // Handle Google Login error
  const handleGoogleLoginError = (error) => {
    console.error('Google Login Failed:', error);
  };

  // Handle modal submit (register new user)
  const handleModalSubmit = async () => {
    if (userData && passwordModal) {
      const { email, name } = userData;
      // Register new user and then login
      await dispatch(register(name, email, passwordModal, 'buyer')); // Register with role 'Buyer'
      dispatch(login(email, passwordModal)); // Login after successful registration
      setShowModal(false); // Close modal
    }
  };

  // Handle regular login (email + password)
  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(login(email, password)); // Dispatch login action
  };

  return (
    <FormContainer>
      <h1>Sign In</h1>
      {error && <Message variant="danger">{error}</Message>}
      {loading && <Loader />}

      {/* Google Login Button */}
      <GoogleLogin
        onSuccess={handleGoogleLoginSuccess}
        onError={handleGoogleLoginError}
      />

      {/* Form for regular login */}
      <Form onSubmit={submitHandler}>
        <Form.Group controlId="email">
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Button type="submit" variant="primary" className="mt-3">
          Sign In
        </Button>
      </Form>
      {/* New Customer Link */}
      <Row className="py-3">
        <Col>
          New Customer?{' '}
          <Link to={redirect ? `/register?redirect=${redirect}` : '/register'}>
            Register
          </Link>
        </Col>
      </Row>

      {/* Modal for new user registration */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Enter Password to Register</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="password"
            placeholder="Enter Password"
            value={passwordModal}
            onChange={(e) => setPasswordModal(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleModalSubmit}>
            Register and Login
          </Button>
        </Modal.Footer>
      </Modal>
    </FormContainer>
  );
};

export default LoginScreen;
