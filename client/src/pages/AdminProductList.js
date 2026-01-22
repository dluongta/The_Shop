import React, { useEffect } from 'react'
import { Button, Row, Col, Container, Table } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import {
  listAdminProducts,
  deleteProduct,
  createProduct,
} from '../actions/productActions'
import { PRODUCT_CREATE_RESET } from '../constants/productConstants'
import { useNavigate } from 'react-router-dom'
import { LinkContainer } from 'react-router-bootstrap'
import Message from '../components/Message'
import Loader from '../components/Loader'

const AdminProductList = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // ===== AUTH =====
  const { userInfo } = useSelector((state) => state.userLogin)

  // ===== ADMIN PRODUCTS =====
  const productAdminList = useSelector((state) => state.productAdminList)
  const { loading, error, products = [] } = productAdminList

  // ===== DELETE =====
  const productDelete = useSelector((state) => state.productDelete)
  const { success: successDelete } = productDelete

  // ===== CREATE =====
  const productCreate = useSelector((state) => state.productCreate)
  const {
    loading: loadingCreate,
    error: errorCreate,
    success: successCreate,
    product: createdProduct,
  } = productCreate

  // ===== EFFECT =====
  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login')
      return
    }

    // ✅ CREATE XONG → REDIRECT SANG EDIT
    if (successCreate && createdProduct?._id) {
      navigate(`/admin/product/${createdProduct._id}/edit`)
      dispatch({ type: PRODUCT_CREATE_RESET })
    } else {
      dispatch(listAdminProducts())
    }
  }, [
    dispatch,
    navigate,
    userInfo,
    successDelete,
    successCreate,
    createdProduct,
  ])

  // ===== HANDLERS =====
  const deleteHandler = (id) => {
    if (window.confirm('Are you sure?')) {
      dispatch(deleteProduct(id))
    }
  }

  const createProductHandler = () => {
    dispatch(createProduct())
  }

  // ===== RENDER =====
  return (
    <Container>
      <Row className="align-items-center">
        <Col>
          <h1>Admin Products</h1>
        </Col>
        <Col className="text-end">
          <Button className="my-3" onClick={createProductHandler}>
            <i className="fas fa-plus"></i> Create Product
          </Button>
        </Col>
      </Row>

      {loadingCreate && <Loader />}
      {errorCreate && <Message variant="danger">{errorCreate}</Message>}

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>NAME</th>
              <th>PRICE</th>
              <th>CATEGORY</th>
              <th>BRAND</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No products
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id}>
                  <td>{product._id}</td>
                  <td>{product.name}</td>
                  <td>${product.price}</td>
                  <td>{product.category}</td>
                  <td>{product.brand}</td>
                  <td>
                    <LinkContainer to={`/admin/product/${product._id}/edit`}>
                      <Button variant="light" className="btn-sm me-2">
                        <i className="fas fa-edit" />
                      </Button>
                    </LinkContainer>
                    <Button
                      variant="danger"
                      className="btn-sm"
                      onClick={() => deleteHandler(product._id)}
                    >
                      <i className="fas fa-trash" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </Container>
  )
}

export default AdminProductList
