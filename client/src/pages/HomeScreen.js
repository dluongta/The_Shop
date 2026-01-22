import React, { useEffect, useState } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Form, Row, Col, Button, Modal } from 'react-bootstrap'
import { useGoogleOneTapLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

import Message from '../components/Message'
import Loader from '../components/Loader'
import Paginate from '../components/Paginate'
import Meta from '../components/Meta'
import LatestProducts from '../components/homePage/LatestProducts'
import ProductCarousel from '../components/ProductCarousel'
import SearchBar from '../layout/SearchBar'

import { listProducts } from '../actions/productActions'
import {
  login,
  register,
  checkEmailExists,
  loginWithPasswordFromApi,
} from '../actions/userActions'

const HomeScreen = () => {
  const { keyword, pageNumber = 1 } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  /* =========================
     FILTER STATE
  ========================= */
  const searchParams = new URLSearchParams(location.search)
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || '')

  /* =========================
     GOOGLE REGISTER MODAL
  ========================= */
  const [showModal, setShowModal] = useState(false)
  const [googleUser, setGoogleUser] = useState(null)
  const [passwordModal, setPasswordModal] = useState('')

  const productList = useSelector((state) => state.productList)
  const { loading, error, products = [], page = 1, pages = 1 } = productList

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  /* =========================
     FETCH PRODUCTS
  ========================= */
  useEffect(() => {
    dispatch(listProducts(keyword, pageNumber, '', minPrice, maxPrice, sort))
  }, [dispatch, keyword, pageNumber, minPrice, maxPrice, sort])

  /* =========================
     GOOGLE ONE TAP LOGIN
     (THEO ĐÚNG FLOW BẠN YÊU CẦU)
  ========================= */
  useGoogleOneTapLogin({
    disabled: !!userInfo,
    onSuccess: async (res) => {
      try {
        const decoded = jwtDecode(res.credential)
        const { email, name } = decoded

        const existsRes = await dispatch(checkEmailExists(email))

        if (existsRes?.exists) {
          // ✅ ĐÃ CÓ TÀI KHOẢN
          // → LẤY PASSWORD TỪ API
          // → LOGIN BẰNG EMAIL + PASSWORD
          dispatch(loginWithPasswordFromApi(email))
        } else {
          // 🆕 CHƯA CÓ TÀI KHOẢN → HIỆN MODAL
          setGoogleUser({ name, email })
          setShowModal(true)
        }
      } catch (err) {
        console.error('Google One Tap error:', err)
      }
    },
    onError: () => console.log('Google One Tap failed'),
  })

  /* =========================
     REGISTER FROM MODAL
  ========================= */
  const handleRegisterFromGoogle = async () => {
    if (!passwordModal || !googleUser) return

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
    setGoogleUser(null)
  }

  /* =========================
     FILTER SUBMIT
  ========================= */
  const submitHandler = (e) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (sort) params.set('sort', sort)

    navigate(`${keyword ? `/search/${keyword}/${pageNumber}` : '/'}?${params}`)
  }

  return (
    <>
      <Meta />
      <SearchBar />

      {!keyword && (
        <Container>
          <h1>Top Products</h1>
          <ProductCarousel />
        </Container>
      )}

      <Container>
        <h1>Latest Products</h1>

        {/* FILTER */}
        <Form onSubmit={submitHandler} className="mb-3">
          <Row>
            <Col md={3}>
              <Form.Control
                type="number"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </Col>

            <Col md={3}>
              <Form.Control
                type="number"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </Col>

            <Col md={3}>
              <Form.Control
                as="select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="">Sort</option>
                <option value="price_asc">Price: Ascending</option>
                <option value="price_desc">Price: Descending</option>
                <option value="name_asc">Name: A - Z</option>
                <option value="name_desc">Name: Z - A</option>
              </Form.Control>
            </Col>

            <Col md={3}>
              <Button type="submit" className="w-100">
                Apply
              </Button>
            </Col>
          </Row>
        </Form>

        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
          <>
            <LatestProducts products={products} />
            <Paginate pages={pages} page={page} keyword={keyword || ''} />
          </>
        )}
      </Container>

      {/* =========================
          GOOGLE REGISTER MODAL
      ========================= */}
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
            placeholder="Enter password"
            value={passwordModal}
            onChange={(e) => setPasswordModal(e.target.value)}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRegisterFromGoogle}>
            Register & Login
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default HomeScreen
