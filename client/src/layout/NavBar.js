import React from 'react'
import { LinkContainer } from 'react-router-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Navbar, Nav, NavDropdown } from 'react-bootstrap'
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
    <Navbar expand="lg" variant="dark" bg="dark" fixed="top" className="mb-5">
      <div className="container">
        <LinkContainer to="/">
          <Navbar.Brand>The Shop</Navbar.Brand>
        </LinkContainer>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto d-flex flex-column flex-lg-row">
            {/* Chat link */}
            <Nav.Item>
              <LinkContainer to="/chat">
                <Nav.Link>
                  <i className="fas fa-comment"></i> Chat
                </Nav.Link>
              </LinkContainer>
            </Nav.Item>

            {/* Cart link with item count */}
            <Nav.Item>
              <LinkContainer to="/cart">
                <Nav.Link>
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
                </Nav.Link>
              </LinkContainer>
            </Nav.Item>

            {/* Discount link */}
            <Nav.Item>
              <LinkContainer to="/discounts">
                <Nav.Link>
                  <i className="fas fa-tag"></i> Discounts
                </Nav.Link>
              </LinkContainer>
            </Nav.Item>

            {userInfo && userInfo.role === "seller" && (
              <Nav.Item>
                <LinkContainer to="/seller/products">
                  <Nav.Link>My Products</Nav.Link>
                </LinkContainer>
              </Nav.Item>
            )}

            {/* Orders Dropdown */}
            {userInfo && (
              <Nav.Item>
                <NavDropdown title="Orders" id="orders-dropdown" className="text-white">
                  <NavDropdown.Item>
                    <LinkContainer to="/orders">
                      <Nav.Link>My Orders</Nav.Link>
                    </LinkContainer>
                  </NavDropdown.Item>
                  {userInfo.role === "seller" && (
                    <NavDropdown.Item>
                      <LinkContainer to="/seller/orders">
                        <Nav.Link>My Sales</Nav.Link>
                      </LinkContainer>
                    </NavDropdown.Item>
                  )}
                </NavDropdown>
              </Nav.Item>
            )}

            {/* User Profile and Logout */}
            {userInfo ? (
              <>
                <Nav.Item>
                  <LinkContainer to="/profile">
                    <Nav.Link>{userInfo.name}</Nav.Link>
                  </LinkContainer>
                </Nav.Item>
                <Nav.Item>
                  <LinkContainer to="/" onClick={logoutHandler}>
                    <Nav.Link>Logout</Nav.Link>
                  </LinkContainer>
                </Nav.Item>
              </>
            ) : (
              <Nav.Item>
                <LinkContainer to="/login">
                  <Nav.Link>
                    <i className="fas fa-user"></i> Sign In
                  </Nav.Link>
                </LinkContainer>
              </Nav.Item>
            )}

            {/* Admin Links */}
            {userInfo && userInfo.isAdmin && (
              <>
                <Nav.Item>
                  <LinkContainer to="/admin/userlist">
                    <Nav.Link>Shoppers</Nav.Link>
                  </LinkContainer>
                </Nav.Item>
                <Nav.Item>
                  <LinkContainer to="/admin/productlist">
                    <Nav.Link>All Products</Nav.Link>
                  </LinkContainer>
                </Nav.Item>
                <Nav.Item>
                  <LinkContainer to="/admin/orderlist">
                    <Nav.Link>All Orders</Nav.Link>
                  </LinkContainer>
                </Nav.Item>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
};
