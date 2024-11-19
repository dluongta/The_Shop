import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Nav } from 'react-bootstrap';
import { logout } from '../actions/userActions';

export const NavBar = () => {
  const dispatch = useDispatch();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const logoutHandler = () => {
    dispatch(logout());
  };

  const cart = useSelector((state) => state.cart);
  const { cartItems } = cart;

  return (
    <nav className='navbar navbar-expand-lg navbar-dark bg-dark fixed-top mb-5'>
      <div className='container'>
        <LinkContainer to='/'>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a className='navbar-brand'>The Shop</a>
        </LinkContainer>
        <button
          className='navbar-toggler'
          type='button'
          data-bs-toggle='collapse'
          data-bs-target='#navbarResponsive'
          aria-controls='navbarResponsive'
          aria-expanded='false'
          aria-label='Toggle navigation'
        >
          <span className='navbar-toggler-icon' />
        </button>
        <div className='collapse navbar-collapse' id='navbarResponsive'>
          <ul className='navbar-nav ms-auto'>
            <li className='nav-item active'>
              <LinkContainer to='/cart'>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a className='nav-link text-white'>
                  {/* {userInfo ? userInfo.name : <i className='fa fa-user'></i>} */}
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
            {/* Chat Icon */}
            <li className='nav-item'>
              <LinkContainer to='/chat'>
                <a className='nav-link text-white'>
                  <i className='fas fa-comment'></i> Chat
                </a>
              </LinkContainer>
            </li>
            <li className='nav-item dropdown'>
              <a
                className='nav-link dropdown-toggle text-white'
                href='/'
                id='navbarDropdown'
                role='button'
                data-bs-toggle='dropdown'
                aria-haspopup='true'
                aria-expanded='false'
              >
                {userInfo ? userInfo.name : <i className='fa fa-user'></i>}
              </a>
              <div
                className='dropdown-menu dropdown-menu-end animate slideIn bg-dark text-white'
                aria-labelledby='navbarDropdown'
              >
                {userInfo ? (
                  <div title={userInfo.name} id='username'>
                    <LinkContainer to='/profile'>
                      <a className='dropdown-item bg-dark text-white'>My Profile</a>
                    </LinkContainer>
                    <LinkContainer to='/'>
                      <a className='dropdown-item bg-dark text-white' onClick={logoutHandler}>
                        Logout
                      </a>
                    </LinkContainer>
                  </div>
                ) : (
                  <LinkContainer to='/login'>
                    <Nav.Link className='text-white'>
                      <i className='fas fa-user'></i> Sign In
                    </Nav.Link>
                  </LinkContainer>
                )}

                {userInfo && userInfo.isAdmin && (
                  <>
                    <div className='dropdown-divider' />
                    <LinkContainer to='/admin/userlist'>
                      <a className='dropdown-item bg-dark text-white'>Shoppers</a>
                    </LinkContainer>
                    <LinkContainer to='/admin/productlist'>
                      <a className='dropdown-item bg-dark text-white'>Products</a>
                    </LinkContainer>
                    <LinkContainer to='/admin/orderlist'>
                      <a className='dropdown-item bg-dark text-white'>Orders</a>
                    </LinkContainer>
                  </>
                )}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
