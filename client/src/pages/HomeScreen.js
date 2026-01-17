import React, { useEffect, useState } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Form, Row, Col, Button } from 'react-bootstrap'

import Message from '../components/Message'
import Loader from '../components/Loader'
import Paginate from '../components/Paginate'
import Meta from '../components/Meta'
import { listProducts } from '../actions/productActions'
import LatestProducts from '../components/homePage/LatestProducts'
import ProductCarousel from '../components/ProductCarousel'
import SearchBar from '../layout/SearchBar'

const HomeScreen = () => {
  const { keyword, pageNumber = 1 } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Lấy filter từ URL
  const searchParams = new URLSearchParams(location.search)
  const initMinPrice = searchParams.get('minPrice') || ''
  const initMaxPrice = searchParams.get('maxPrice') || ''
  const initSort = searchParams.get('sort') || ''

  // Local state quản lý filter inputs
  const [minPrice, setMinPrice] = useState(initMinPrice)
  const [maxPrice, setMaxPrice] = useState(initMaxPrice)
  const [sort, setSort] = useState(initSort)

  const productList = useSelector((state) => state.productList) || {}
  const { loading, error, products = [], page = 1, pages = 1 } = productList

  // Khi URL query thay đổi thì update state filter
  useEffect(() => {
    setMinPrice(initMinPrice)
    setMaxPrice(initMaxPrice)
    setSort(initSort)
  }, [initMinPrice, initMaxPrice, initSort])

  // Gọi API mỗi khi filter hoặc keyword/pageNumber thay đổi
  useEffect(() => {
    dispatch(listProducts(keyword, pageNumber, '', minPrice, maxPrice, sort))
  }, [dispatch, keyword, pageNumber, minPrice, maxPrice, sort])

  // Xử lý submit form filter: cập nhật URL query param
  // const submitHandler = (e) => {
  //   e.preventDefault()

  //   const params = new URLSearchParams()
  //   if (minPrice) params.set('minPrice', minPrice)
  //   if (maxPrice) params.set('maxPrice', maxPrice)
  //   if (sort) params.set('sort', sort)

  //   const basePath = keyword ? `/search/${keyword}/${pageNumber}` : `/`
  //   navigate(`${basePath}?${params.toString()}`)
  // }
const submitHandler = (e) => {
  e.preventDefault()

  const params = new URLSearchParams()

  if (minPrice !== '') params.set('minPrice', Number(minPrice))
  if (maxPrice !== '') params.set('maxPrice', Number(maxPrice))
  if (sort) params.set('sort', sort)

  const basePath = keyword ? `/search/${keyword}/${pageNumber}` : `/`
  navigate(`${basePath}?${params.toString()}`)
}

  return (
    <>
      <Meta />
      <SearchBar />

      {!keyword ? (
        <Container>
          <h1>Top Products</h1>
          <ProductCarousel />
        </Container>
      ) : (
        <Container>
          <Link to='/' className='btn btn-light mb-3'>
            Go Back
          </Link>
        </Container>
      )}

      <Container>
        <h1>Latest Products</h1>

        {/* Filter Form */}
        <Form onSubmit={submitHandler} className="mb-3">
          <Row className="align-items-end">
            <Col xs={12} md={3}>
              <Form.Group controlId="minPrice">
                <Form.Label>Min Price</Form.Label>
                <Form.Control
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min Price"
                  min="0"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={3}>
              <Form.Group controlId="maxPrice">
                <Form.Label>Max Price</Form.Label>
                <Form.Control
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max Price"
                  min="0"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={3}>
              <Form.Group controlId="sort">
                <Form.Label>Sort By</Form.Label>
                <Form.Control
                  as="select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="name_desc">Name: Z to A</option>
                </Form.Control>
              </Form.Group>
            </Col>
            <Col xs={12} md={3} className="mt-3 mt-md-0"> 
              <Button type="submit" variant="primary" className="w-100">
                Apply Filters
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
            <Paginate pages={pages} page={page} keyword={keyword ? keyword : ''} />
          </>
        )}
      </Container>
    </>
  )
}

export default HomeScreen
