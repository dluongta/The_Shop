import React, { useEffect } from 'react'
import { Table, Button } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import { getSellerOrders } from '../actions/orderActions'
import { useNavigate } from 'react-router-dom'

const SellOrdersScreen = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const orderList = useSelector((state) => state.orderListMySell)
  const { loading, error, orders } = orderList
  console.log(orderList)

  useEffect(() => {
    dispatch(getSellerOrders())
  }, [dispatch])

  return (
    <>
      <h1>Seller Orders</h1>
      {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : (
        <Table striped bordered hover responsive className='table-sm'>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Delivered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>{order.createdAt.substring(0, 10)}</td>
                <td>${order.totalPrice}</td>
                <td>{order.isPaid ? order.paidAt.substring(0, 10) : 'No'}</td>
                <td>{order.isDelivered ? order.deliveredAt.substring(0, 10) : 'No'}</td>
                <td>
                  <Button variant='light' className='btn-sm' onClick={() => navigate(`/order/${order._id}`)}>
                    Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}

export default SellOrdersScreen
