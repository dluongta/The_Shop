import React from 'react'
import { LinkContainer } from 'react-router-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Nav } from 'react-bootstrap'
import { logout } from '../actions/userActions'

export const NavBar = () => {
  const dispatch = useDispatch()

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin
  const logoutHandler = () => {
    dispatch(logout())
  }
  const cart = useSelector((state) => state.cart)
  const { cartItems } = cart

  return (
    <nav className='navbar navbar-expand-lg navbar-dark bg-dark fixed-top mb-5'>
      <div className='container'>
        <LinkContainer to='/'>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a className='navbar-brand'>The Shop</a>
        </LinkContainer>

        <ul className='navbar-nav ms-auto d-flex flex-row'>
          <li>
            <LinkContainer to='/chat'>
              <a className='nav-link text-white'>
                <i className='fas fa-comment'></i> Chat
              </a>
            </LinkContainer>
          </li>
          <li>
            <LinkContainer to='/cart'>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a className='nav-link text-white'>
                {userInfo ? (
                  <>
                    <i className='fas fa-shopping-cart'></i> Cart (
                    {cartItems.reduce((acc, item) => acc + item.qty, 0)})
                  </>
                ) : (
                  <>
                    <i className='fas fa-shopping-cart'></i> Cart
                  </>
                )}
              </a>
            </LinkContainer>
          </li>

          {userInfo ? (
            <>
              <li>
                <a className='nav-link text-white'>
                  <LinkContainer to='/profile'>
                    <a className='dropdown-item bg-dark text-white'>{userInfo.name}</a>
                  </LinkContainer>
                </a>
              </li>
              <li>
                <a className='nav-link text-white'>

                  <LinkContainer to='/'>
                    <a className='dropdown-item bg-dark text-white' onClick={logoutHandler}>
                      Logout
                    </a>
                  </LinkContainer>
                </a>
              </li>
            </>
          ) : (
            <li>
              <LinkContainer to='/chat'>
                <a className='nav-link text-white'>
                  <i className='fas fa-user'></i> Sign In
                </a>
              </LinkContainer>
            </li>
          )}

          {userInfo && userInfo.isAdmin && (
            <>
              <li>
                <a className='nav-link text-white'>

                  <LinkContainer to='/admin/userlist'>
                    <a className='dropdown-item bg-dark text-white'>Shoppers</a>
                  </LinkContainer>
                </a>
              </li>
              <li>
                <a className='nav-link text-white'>

                  <LinkContainer to='/admin/productlist'>
                    <a className='dropdown-item bg-dark text-white'>Products</a>
                  </LinkContainer>
                </a>
              </li>
              <li>
                <a className='nav-link text-white'>

                  <LinkContainer to='/admin/orderlist'>
                    <a className='dropdown-item bg-dark text-white'>Orders</a>
                  </LinkContainer>
                </a>
              </li>

            </>
          )}


          {userInfo && userInfo.role == "seller" && (
            <>
              <li>
                <a className='nav-link text-white'>

                  <LinkContainer to="/seller/products">
                    <a className="dropdown-item bg-dark text-white">My Products</a>
                  </LinkContainer>
                </a>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}