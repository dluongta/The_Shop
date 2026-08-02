import React, { useEffect, useState } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import Badge from 'react-bootstrap/Badge';
import Dropdown from 'react-bootstrap/Dropdown';

import { logout } from '../actions/userActions';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../actions/notificationActions';

export const NavBar = ({ socket }) => {
  const [expanded, setExpanded] = useState(false); // Thêm state quản lý menu

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.userLogin);
  const { cartItems } = useSelector((state) => state.cart);
  const notificationList = useSelector((state) => state.notificationList);
  const { notifications = [] } = notificationList;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (userInfo) {
      dispatch(listNotifications());
    }
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (!socket?.current || !userInfo) return;

    const handleNewNotification = (data) => {
      dispatch(listNotifications());
    };

    socket.current.on("newNotification", handleNewNotification);

    return () => {
      socket.current.off("newNotification", handleNewNotification);
    };
  }, [socket, userInfo, dispatch]);

  const handleCloseMenu = () => {
    setExpanded(false); // Đóng menu
  };

  const logoutHandler = () => {
    dispatch(logout());
    handleCloseMenu();
  };

  const handleNotificationClick = (notification) => {
    dispatch(markNotificationRead(notification._id));

    if (notification.link) {
      navigate(notification.link);
    }
    handleCloseMenu();
  };

  return (
    <Navbar
      expand="lg"
      variant="dark"
      bg="dark"
      fixed="top"
      className="mb-5"
      expanded={expanded}
      onToggle={(isExpanded) => setExpanded(isExpanded)}
    >
      <div className="container">
        <LinkContainer to="/" onClick={handleCloseMenu}>
          <Navbar.Brand>The Shop</Navbar.Brand>
        </LinkContainer>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center text-center">

            {userInfo && (
              <Dropdown align="end" as={Nav.Item} className="me-lg-3">
                <Dropdown.Toggle
                  as={Nav.Link}
                  id="dropdown-notification"
                  className="d-flex justify-content-center align-items-center"
                >
                  <span className="position-relative d-inline-block me-3">
                    <i className="fas fa-bell"></i> Notification

                    {unreadCount > 0 && (
                      <span
                        className="position-absolute translate-middle d-flex align-items-center justify-content-center"
                        style={{
                          top: '0px',
                          left: '110%',
                          backgroundColor: 'red',
                          color: 'white',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: 0,
                          zIndex: 1
                        }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </span>
                </Dropdown.Toggle>

                <Dropdown.Menu
                  className="mx-auto text-start"
                  style={{
                    width: '320px',
                    maxWidth: '100vw',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    overflowX: 'hidden', 
                    padding: 0,
                    border: 'none',
                    backgroundColor: '#fff'
                  }}
                >
                  {unreadCount > 0 && (
                    <Dropdown.Item
                      className="p-0 m-0 border-0"
                      onClick={() => {
                        dispatch(markAllNotificationsRead());
                        handleCloseMenu();
                      }}
                    >
                      <div
                        className="text-center fw-bold p-3"
                        style={{
                          backgroundColor: '#212529',
                          color: '#4dabf7',
                          borderBottom: '1px solid #404953',
                          display: 'block',
                          width: '100%',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#212529';
                          e.currentTarget.style.color = '#4dabf7';
                        }}
                      >
                        <i className="fas fa-check-double me-2"></i>
                        Mark all as read
                      </div>
                    </Dropdown.Item>
                  )}

                  {notifications.length === 0 && (
                    <div
                      className="text-center p-3"
                      style={{
                        backgroundColor: '#404953',
                        color: '#ffffff',
                      }}
                    >
                      Không có thông báo mới
                    </div>
                  )}

                  {notifications.map((n) => (
                    <Dropdown.Item
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className="p-0 m-0 border-0 text-wrap"
                    >
                      <div
                        style={{
                          padding: '12px 16px',
                          backgroundColor: n.isRead ? '#87CEFA' : '#0368f5',
                          color: '#000',
                          fontWeight: n.isRead ? 'normal' : 'bold',
                          borderBottom: '1px solid #ddd',
                          display: 'block',
                          width: '100%',
                          whiteSpace: 'normal',    
                          wordBreak: 'break-word', 
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = n.isRead ? '#87CEFA' : '#0368f5';
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span>{n.title}</span>
                          {!n.isRead && (
                            <Badge
                              pill
                              style={{
                                backgroundColor: '#ff5608',
                                color: '#fff',
                              }}
                            >
                              New
                            </Badge>
                          )}
                        </div>
                        <small className="d-block mb-1" style={{ color: '#212529' }}>
                          {n.message}
                        </small>
                        <div className="text-end" style={{ fontSize: '0.75rem', color: '#495057' }}>
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}

            <LinkContainer to="/chat">
              <Nav.Link onClick={handleCloseMenu}>
                <i className="fas fa-comment"></i> Chat
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/chatbot">
              <Nav.Link onClick={handleCloseMenu}>
                <i className="fas fa-message"></i> Chatbot
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/cart">
              <Nav.Link onClick={handleCloseMenu}>
                <i className="fas fa-shopping-cart"></i>{' '}
                Cart {userInfo && `(${cartItems.reduce((a, c) => a + c.qty, 0)})`}
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/discounts">
              <Nav.Link onClick={handleCloseMenu}>
                <i className="fas fa-tag"></i> Discounts
              </Nav.Link>
            </LinkContainer>

            {userInfo?.role === 'seller' && (
              <LinkContainer to="/seller/products">
                <Nav.Link onClick={handleCloseMenu}>My Products</Nav.Link>
              </LinkContainer>
            )}

            {userInfo && (
              <NavDropdown title="Orders" id="orders-dropdown">
                <LinkContainer to="/orders">
                  <NavDropdown.Item onClick={handleCloseMenu}>My Orders</NavDropdown.Item>
                </LinkContainer>
                {userInfo.role === 'seller' && (
                  <LinkContainer to="/seller/orders">
                    <NavDropdown.Item onClick={handleCloseMenu}>My Sales</NavDropdown.Item>
                  </LinkContainer>
                )}
              </NavDropdown>
            )}

            {userInfo?.isAdmin && (
              <>
                <LinkContainer to="/admin/userlist">
                  <Nav.Link onClick={handleCloseMenu}>Shoppers</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/admin/productlist">
                  <Nav.Link onClick={handleCloseMenu}>All Products</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/admin/orderlist">
                  <Nav.Link onClick={handleCloseMenu}>All Orders</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/admin/discount/create">
                  <Nav.Link onClick={handleCloseMenu}>Add Discount</Nav.Link>
                </LinkContainer>
              </>
            )}

            {userInfo ? (
              <>
                <LinkContainer to="/profile">
                  <Nav.Link onClick={handleCloseMenu}>{userInfo.name}</Nav.Link>
                </LinkContainer>
                <Nav.Link onClick={logoutHandler}>Logout</Nav.Link>
              </>
            ) : (
              <LinkContainer to="/login">
                <Nav.Link onClick={handleCloseMenu}>
                  <i className="fas fa-user"></i> Sign In
                </Nav.Link>
              </LinkContainer>
            )}

          </Nav>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
};