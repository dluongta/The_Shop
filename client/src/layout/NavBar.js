import React from 'react'
import { LinkContainer } from 'react-router-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Nav, Dropdown, DropdownButton } from 'react-bootstrap'
import { logout } from '../actions/userActions'

export const NavBar = () => {
  const dispatch = useDispatch();

  // Get user login status
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  // Handle logout
  const logoutHandler = () => {
    dispatch(logout());
  };

  // Get cart items
  const cart = useSelector((state) => state.cart);
  const { cartItems } = cart;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top mb-5">
      <div className="container">
        <LinkContainer to="/">
          <a className="navbar-brand">The Shop</a>
        </LinkContainer>

        <ul className="navbar-nav ms-auto d-flex flex-row">
          {/* Chat link */}
          <li className="nav-item">
            <LinkContainer to="/chat">
              <a className="nav-link text-white">
                <i className="fas fa-comment"></i> Chat
              </a>
            </LinkContainer>
          </li>

          {/* Cart link with item count */}
          <li className="nav-item">
            <LinkContainer to="/cart">
              <a className="nav-link text-white">
                {userInfo ? (
                  <>
                    <i className="fas fa-shopping-cart"></i> Cart (
                    {cartItems.reduce((acc, item) => acc + item.qty, 0)} )
                  </>
                ) : (
                  <>
                    <i className="fas fa-shopping-cart"></i> Cart
                  </>
                )}
              </a>
            </LinkContainer>
          </li>

          {/* Discount link */}
          <li className="nav-item">
            <LinkContainer to="/discounts">
              <a className="nav-link text-white">
                <i className="fas fa-tag"></i> Discounts
              </a>
            </LinkContainer>
          </li>
          {userInfo.role === "seller" && (
          <li className="nav-item">
                    <LinkContainer to="/seller/products">
                      <a className="nav-link text-white">
                        My Products
                      </a>
                    </LinkContainer>
          </li>)}

          {/* Orders Dropdown */}
          {userInfo && (
            <li className="nav-item">
              <DropdownButton
                drop="down"
                id="orders-dropdown"
                title="Orders"
                className="text-white"
                style={{
                  color: "white",
                  border: "none",
                  boxShadow: "none",
                }}
              >
                <Dropdown.Item>
                  <LinkContainer to="/orders">
                    <a className="dropdown-item bg-dark text-white" style={{ textDecoration: "none" }}>
                      My Orders
                    </a>
                  </LinkContainer>
                </Dropdown.Item>
                {userInfo.role === "seller" && (
                  <Dropdown.Item>
                    <LinkContainer to="/seller/orders">
                      <a className="dropdown-item bg-dark text-white" style={{ textDecoration: "none" }}>
                        My Sales
                      </a>
                    </LinkContainer>
                  </Dropdown.Item>
                )}
              </DropdownButton>
            </li>
          )}

          {/* User Profile and Logout */}
          {userInfo ? (
            <>
              <li className="nav-item">
                <LinkContainer to="/profile">
                  <a className="nav-link text-white">{userInfo.name}</a>
                </LinkContainer>
              </li>
              <li className="nav-item">
                <LinkContainer to="/" onClick={logoutHandler}>
                  <a className="nav-link text-white">Logout</a>
                </LinkContainer>
              </li>
            </>
          ) : (
            <li className="nav-item">
              <LinkContainer to="/login">
                <a className="nav-link text-white">
                  <i className="fas fa-user"></i> Sign In
                </a>
              </LinkContainer>
            </li>
          )}

          {/* Admin Links */}
          {userInfo && userInfo.isAdmin && (
            <>
              <li className="nav-item">
                <LinkContainer to="/admin/userlist">
                  <a className="nav-link text-white">Shoppers</a>
                </LinkContainer>
              </li>
              {/* Modify the link for admin Products */}
              <li className="nav-item">
                <LinkContainer to="/admin/productlist">
                  <a className="nav-link text-white">All Products</a>
                </LinkContainer>
              </li>
              <li className="nav-item">
                <LinkContainer to="/admin/orderlist">
                  <a className="nav-link text-white">All Orders</a>
                </LinkContainer>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

