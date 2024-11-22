import React from 'react'
import { LinkContainer } from 'react-router-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Nav } from 'react-bootstrap'
import { logout } from '../actions/userActions'

export const NavBar = () => {
  const dispatch = useDispatch()

  // Get user login status
  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin
  
  // Handle logout
  const logoutHandler = () => {
    dispatch(logout())
  }

  // Get cart items
  const cart = useSelector((state) => state.cart)
  const { cartItems } = cart

  return (
    <nav className='navbar navbar-expand-lg navbar-dark bg-dark fixed-top mb-5'>
      <div className='container'>
        <LinkContainer to='/'>
          <a className='navbar-brand'>The Shop</a>
        </LinkContainer>

        <ul className='navbar-nav ms-auto d-flex flex-row'>
          {/* Chat link */}
          <li>
            <LinkContainer to='/chat'>
              <a className='nav-link text-white'>
                <i className='fas fa-comment'></i> Chat
              </a>
            </LinkContainer>
          </li>

          {/* Cart link with item count */}
          <li>
            <LinkContainer to='/cart'>
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

          {/* Discount link */}
          <li>
            <LinkContainer to='/discounts'>
              <a className='nav-link text-white'>
                <i className='fas fa-tag'></i> Discounts
              </a>
            </LinkContainer>
          </li>

          {/* User Profile and Logout */}
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

          {/* Admin Links */}
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

          {/* Seller Links */}
          {userInfo && userInfo.role === 'seller' && (
            <>
              <li>
                <a className='nav-link text-white'>
                  <LinkContainer to='/seller/products'>
                    <a className='dropdown-item bg-dark text-white'>My Products</a>
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
