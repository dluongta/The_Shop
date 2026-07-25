import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Row, Col, ListGroup, Image, Card, Form, InputGroup } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import Message from '../components/Message'
import CheckoutSteps from '../components/CheckoutSteps'
import { createOrder } from '../actions/orderActions'
import { ORDER_CREATE_RESET } from '../constants/orderConstants'
import { USER_DETAILS_RESET } from '../constants/userConstants'

const PlaceOrderScreen = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const cart = useSelector((state) => state.cart)
  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin 

  const errorRef = useRef(null)

  const [discountCodeInput, setDiscountCodeInput] = useState('')
  // CẬP NHẬT: Đổi `percent` thành `amount` và thêm `discountType` vào state
  const [appliedDiscount, setAppliedDiscount] = useState({ code: '', amount: 0, discountType: 'percent' })
  const [discountError, setDiscountError] = useState(null)
  const [discountSuccess, setDiscountSuccess] = useState(null)

  if (!cart.shippingAddress.address) {
    navigate('/shipping')
  } else if (!cart.paymentMethod) {
    navigate('/payment')
  }

  const addDecimals = (num) => (Math.round(num * 100) / 100).toFixed(2)

  cart.itemsPrice = addDecimals(
    cart.cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  )
  cart.shippingPrice = addDecimals(cart.itemsPrice > 100 ? 0 : 100)
  cart.taxPrice = addDecimals(Number((0.15 * cart.itemsPrice).toFixed(2)))

  let calculatedDiscountAmount = 0
  if (appliedDiscount.amount > 0) {
    if (appliedDiscount.discountType === 'fixed') {
      calculatedDiscountAmount = Number(appliedDiscount.amount)
    } else {
      // Tính theo phần trăm
      calculatedDiscountAmount = (Number(cart.itemsPrice) * appliedDiscount.amount) / 100
    }
  }
  
  const finalDiscountAmount = Number(calculatedDiscountAmount.toFixed(2))

  // Đảm bảo tổng tiền không bị âm nếu mã giảm giá fixed lớn hơn tổng đơn hàng
  let calculatedTotal = (
    Number(cart.itemsPrice) +
    Number(cart.shippingPrice) +
    Number(cart.taxPrice) -
    finalDiscountAmount
  )
  cart.totalPrice = calculatedTotal > 0 ? calculatedTotal.toFixed(2) : "0.00"

  const orderCreate = useSelector((state) => state.orderCreate)
  const { order, success, error } = orderCreate

  useEffect(() => {
    if (success) {
      navigate(`/order/${order._id}`)
      dispatch({ type: USER_DETAILS_RESET })
      dispatch({ type: ORDER_CREATE_RESET })
    }
  }, [success, dispatch, navigate, order])

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [error])

  const applyDiscountHandler = async (e) => {
    e.preventDefault()
    if (!discountCodeInput.trim()) return

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      }
      
      const { data } = await axios.post('/api/discounts/apply', { code: discountCodeInput }, config)

      // Cập nhật state với loại giảm giá (discountType) trả về từ server
      setAppliedDiscount({ 
        code: data.code, 
        amount: data.amount, 
        discountType: data.discountType || 'percent' 
      })

      // Thông báo linh hoạt theo loại giảm giá
      const successMsg = data.discountType === 'fixed' 
        ? `Đã áp dụng mã giảm $${data.amount} thành công!`
        : `Đã áp dụng mã giảm ${data.amount}% thành công!`
      
      setDiscountSuccess(successMsg)
      setDiscountError(null)
    } catch (err) {
      setDiscountError(
        err.response && err.response.data.message
          ? err.response.data.message
          : err.message
      )
      setAppliedDiscount({ code: '', amount: 0, discountType: 'percent' })
      setDiscountSuccess(null)
    }
  }

  const placeOrderHandler = () => {
    dispatch({ type: ORDER_CREATE_RESET })

    const orderItems = cart.cartItems.map((item) => ({
      product: item.product,
      name: item.name,
      image: item.image,
      price: item.price,
      qty: item.qty,
    }))

    dispatch(
      createOrder({
        orderItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod: cart.paymentMethod,
        itemsPrice: cart.itemsPrice,
        shippingPrice: cart.shippingPrice,
        taxPrice: cart.taxPrice,
        totalPrice: cart.totalPrice,
        discountCode: appliedDiscount.code, 
        discountAmount: finalDiscountAmount,
      })
    )
  }

  return (
    <>
      <CheckoutSteps step1 step2 step3 step4 />
      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p>
                <strong>Address:</strong> {cart.shippingAddress.address},{' '}
                {cart.shippingAddress.city} {cart.shippingAddress.postalCode},{' '}
                {cart.shippingAddress.country}
              </p>
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Payment Method</h2>
              <strong>Method: </strong>
              {cart.paymentMethod}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Order Items</h2>
              {cart.cartItems.length === 0 ? (
                <Message>Your cart is empty</Message>
              ) : (
                <ListGroup variant='flush'>
                  {cart.cartItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row>
                        <Col md={1}>
                          <Image src={item.image} alt={item.name} fluid rounded />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`}>
                            {item.name}
                          </Link>
                        </Col>
                        <Col md={4}>
                          {item.qty} x ${item.price} = $
                          {(item.qty * item.price).toFixed(2)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>

        <Col md={4}>
          <Card>
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>

              <ListGroup.Item>
                <Form onSubmit={applyDiscountHandler}>
                  <InputGroup>
                    <Form.Control
                      type='text'
                      placeholder='Nhập mã giảm giá...'
                      value={discountCodeInput}
                      onChange={(e) => setDiscountCodeInput(e.target.value)}
                    />
                    <Button type='submit' variant='dark'>
                      Áp dụng
                    </Button>
                  </InputGroup>
                </Form>
                {discountError && <Message variant='danger' className='mt-2 mb-0'>{discountError}</Message>}
                {discountSuccess && <Message variant='success' className='mt-2 mb-0'>{discountSuccess}</Message>}
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>${cart.itemsPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col>${cart.shippingPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col>${cart.taxPrice}</Col>
                </Row>
              </ListGroup.Item>

              {/* CẬP NHẬT: Hiển thị Đơn vị giảm giá cho phù hợp */}
              {appliedDiscount.amount > 0 && (
                <ListGroup.Item>
                  <Row>
                    <Col>
                      Discount {appliedDiscount.discountType === 'fixed' 
                        ? `($${appliedDiscount.amount})` 
                        : `(${appliedDiscount.amount}%)`}
                    </Col>
                    <Col style={{ color: 'green', fontWeight: 'bold' }}>-${finalDiscountAmount}</Col>
                  </Row>
                </ListGroup.Item>
              )}

              <ListGroup.Item>
                <Row>
                  <Col><strong>Total</strong></Col>
                  <Col><strong>${cart.totalPrice}</strong></Col>
                </Row>
              </ListGroup.Item>

              {error && (
                <ListGroup.Item ref={errorRef}>
                  <Message variant='danger'>{error}</Message>
                </ListGroup.Item>
              )}

              <ListGroup.Item>
                <Button
                  type='button'
                  className='btn-block w-100'
                  disabled={cart.cartItems.length === 0}
                  onClick={placeOrderHandler}
                >
                  Place Order
                </Button>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default PlaceOrderScreen