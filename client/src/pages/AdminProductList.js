import React, { useEffect, useState } from 'react'
import { Button, Row, Col, Container, Table, Form } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { listAdminProducts, deleteProduct, createProduct } from '../actions/productActions'
import { PRODUCT_CREATE_RESET } from '../constants/productConstants'
import { useNavigate, useLocation } from 'react-router-dom'
import { LinkContainer } from 'react-router-bootstrap'

import Message from '../components/Message'
import Loader from '../components/Loader'
import Paginate from '../components/Paginate'

const AdminProductList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  const searchParams = new URLSearchParams(location.search)
  const initMinPrice = searchParams.get('minPrice') || ''
  const initMaxPrice = searchParams.get('maxPrice') || ''
  const initSort = searchParams.get('sort') || ''

  // State quản lý filter
  const [minPrice, setMinPrice] = useState(initMinPrice)
  const [maxPrice, setMaxPrice] = useState(initMaxPrice)
  const [sort, setSort] = useState(initSort)

  const productList = useSelector((state) => state.productAdminList) || {}
  const { loading, error, products = [], page = 1, pages = 1 } = productList

  const productDelete = useSelector((state) => state.productDelete) || {}
  const { loading: loadingDelete, error: errorDelete, success: successDelete } = productDelete

  const productCreate = useSelector((state) => state.productCreate) || {}
  const {
    loading: loadingCreate,
    error: errorCreate,
    success: successCreate,
    product: createdProduct,
  } = productCreate

  const userLogin = useSelector((state) => state.userLogin) || {}
  const { userInfo } = userLogin

  useEffect(() => {
    dispatch({ type: PRODUCT_CREATE_RESET })

    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login')
    }

    if (successCreate) {
      navigate(`/admin/productlist`)
    } else {
      dispatch(listAdminProducts(minPrice, maxPrice, sort))
    }
  }, [
    dispatch,
    navigate,
    userInfo,
    successDelete,
    successCreate,
    createdProduct,
    minPrice,
    maxPrice,
    sort,
  ])

  useEffect(() => {
    setMinPrice(initMinPrice)
    setMaxPrice(initMaxPrice)
    setSort(initSort)
  }, [initMinPrice, initMaxPrice, initSort])

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure?')) {
      dispatch(deleteProduct(id))
    }
  }

  const createProductHandler = () => {
    dispatch(createProduct())
  }

  // Xử lý submit form lọc
  const submitHandler = (e) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (sort) params.set('sort', sort)

    navigate({
      pathname: location.pathname,
      search: `?${params.toString()}`,
    })
  }

  return (
    <Container>
      <Row className="align-items-center">
        <Col>
          <h1>Admin Product List</h1>
        </Col>
        <Col className="text-right">
          <Button className="my-3" onClick={createProductHandler}>
            <i className="fas fa-plus"></i> Add Product
          </Button>
        </Col>
      </Row>

      {/* Form lọc trực tiếp */}
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

      {loadingDelete && <Loader />}
      {errorDelete && <Message variant="danger">{errorDelete}</Message>}
      {loadingCreate && <Loader />}
      {errorCreate && <Message variant="danger">{errorCreate}</Message>}
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <Table striped bordered hover responsive className="table-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>PRICE</th>
                <th>CATEGORY</th>
                <th>BRAND</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(products) && products.length > 0 ? (
                products.map((product) => (
                  <tr key={product._id}>
                    <td>{product._id}</td>
                    <td>{product.name}</td>
                    <td>${product.price}</td>
                    <td>{product.category}</td>
                    <td>{product.brand}</td>
                    <td>
                      <LinkContainer to={`/admin/product/${product._id}/edit`}>
                        <Button variant="light" className="btn-sm">
                          <i className="fas fa-edit"></i>
                        </Button>
                      </LinkContainer>
                      <Button
                        variant="danger"
                        className="btn-sm"
                        onClick={() => deleteHandler(product._id)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          <Paginate pages={pages} page={page} isAdmin={true} />
        </>
      )}
    </Container>
  )
}

export default AdminProductList
