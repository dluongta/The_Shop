import React, { useEffect, useState } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Form, Row, Col, Button, Modal, Card } from 'react-bootstrap'
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
  googleLoginDirect,
} from '../actions/userActions'

const HomeScreen = () => {
  const { keyword } = useParams() 
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [role, setRole] = useState('buyer')
  const [paypalClientId, setPaypalClientId] = useState('')

  /* =========================
     DANH SÁCH CATEGORY (MẪU)
  ========================= */
  const categoryList = ['Máy tính', 'Điện thoại', 'Máy ảnh', 'Thiết bị khác']

  /* =========================
     FILTER & PAGINATION STATE
  ========================= */
  const searchParams = new URLSearchParams(location.search)
  const pageNumber = searchParams.get('pageNumber') || 1 
  
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || '')
  
  // State quản lý mảng các danh mục được tick
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('category') ? searchParams.get('category').split(',') : []
  )

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
    // Lấy chuỗi category từ URL để fetch
    const categoryQuery = searchParams.get('category') || ''
    dispatch(listProducts(keyword, pageNumber, '', minPrice, maxPrice, sort, categoryQuery))
    // eslint-disable-next-line
  }, [dispatch, keyword, pageNumber, location.search])

  /* =========================
     XỬ LÝ TICK CHỌN DANH MỤC
  ========================= */
  const handleCategoryChange = (e) => {
    const value = e.target.value
    const isChecked = e.target.checked

    if (isChecked) {
      setSelectedCategories([...selectedCategories, value])
    } else {
      setSelectedCategories(selectedCategories.filter((c) => c !== value))
    }
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
    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories.join(','))
    }
    
    // Khi áp dụng filter mới, luôn reset về trang 1
    params.set('pageNumber', 1)

    navigate(`${keyword ? `/search/${keyword}` : '/'}?${params.toString()}`)
  }

  /* Google Logic giữ nguyên ... */
  useGoogleOneTapLogin({
    disabled: !!userInfo,
    onSuccess: async (res) => {
      try {
        const decoded = jwtDecode(res.credential)
        const { email, name } = decoded
        const existsRes = await dispatch(checkEmailExists(email))

        if (existsRes?.exists) {
          dispatch(googleLoginDirect(email)) 
        } else {
          setGoogleUser({ name, email })
          setShowModal(true)
        }
      } catch (err) {
        console.error('Google One Tap error:', err)
      }
    },
    onError: () => console.log('Google One Tap failed'),
  })

  const handleRegisterFromGoogle = async () => {
    if (!passwordModal || !googleUser) return
    await dispatch(register(googleUser.name, googleUser.email, passwordModal, role, paypalClientId))
    dispatch(login(googleUser.email, passwordModal))
    setShowModal(false)
    setPasswordModal('')
    setGoogleUser(null)
    setPaypalClientId('')
  }

  return (
    <>
      <Meta />
      <SearchBar />

      {!keyword && (
        <Container>
          <h2 className="mb-4">Top Products</h2>
          <ProductCarousel />
        </Container>
      )}

      <Container className="mt-4">
        <Row>
          {/* CỘT TRÁI: SIDEBAR LỌC SẢN PHẨM */}
          <Col md={3}>
            <Card className="p-3 mb-4 border-0 shadow-sm">
              <Form onSubmit={submitHandler}>
                <h5 className="mb-3">Danh mục sản phẩm</h5>
                <Form.Group className="mb-4">
                  {categoryList.map((cat, index) => (
                    <Form.Check
                      key={index}
                      type="checkbox"
                      label={<span className="fw-bold">{cat}</span>}
                      value={cat}
                      checked={selectedCategories.includes(cat)}
                      onChange={handleCategoryChange}
                      className="mb-2"
                    />
                  ))}
                </Form.Group>

                <h5 className="mb-3">Bộ lọc khác</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Giá tối thiểu</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Min Price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Giá tối đa</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Max Price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Sắp xếp</Form.Label>
                  <Form.Control
                    as="select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="">Mặc định</option>
                    <option value="price_asc">Giá: Thấp đến Cao</option>
                    <option value="price_desc">Giá: Cao đến Thấp</option>
                    <option value="name_asc">Tên: A - Z</option>
                    <option value="name_desc">Tên: Z - A</option>
                  </Form.Control>
                </Form.Group>

                <Button type="submit" variant="dark" className="w-100">
                  Áp dụng bộ lọc
                </Button>
              </Form>
            </Card>
          </Col>

          {/* CỘT PHẢI: DANH SÁCH SẢN PHẨM */}
          <Col md={9}>
            <h2 className="mb-4">Sản phẩm mới nhất</h2>
            {loading ? (
              <Loader />
            ) : error ? (
              <Message variant="danger">{error}</Message>
            ) : (
              <>
                <LatestProducts products={products} />
                <div className="mt-4 d-flex justify-content-center">
                  <Paginate pages={pages} page={page} keyword={keyword ? keyword : ''} />
                </div>
              </>
            )}
          </Col>
        </Row>
      </Container>

      {/* MODAL (Giữ nguyên) */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header>
          <Modal.Title>Create account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please enter a password to create your account <strong>{googleUser?.email}</strong>.</p>
          <Form.Control
            type="password"
            placeholder="Enter password"
            value={passwordModal}
            onChange={(e) => setPasswordModal(e.target.value)}
          />
          <Form.Group className="mt-3">
            <Form.Control as="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="buyer">Buyer (Người mua)</option>
              <option value="seller">Seller (Người bán)</option>
            </Form.Control>
          </Form.Group>
          <Form.Control
            className="mt-3"
            type="text"
            placeholder="PayPal Client ID (Optional)"
            value={paypalClientId}
            onChange={(e) => setPaypalClientId(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleRegisterFromGoogle}>Register & Login</Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default HomeScreen