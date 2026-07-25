import React, { useEffect } from 'react';
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

  const logoutHandler = () => {
    dispatch(logout());
  };

  const handleNotificationClick = (notification) => {
    dispatch(markNotificationRead(notification._id));

    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <Navbar expand="lg" variant="dark" bg="dark" fixed="top" className="mb-5">
      <div className="container">
        <LinkContainer to="/">
          <Navbar.Brand>The Shop</Navbar.Brand>
        </LinkContainer>

        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="ms-auto align-items-center">

            {userInfo && (
              <Dropdown align="end" as={Nav.Item} className="me-3">
                <Dropdown.Toggle
                  as={Nav.Link}
                  id="dropdown-notification"
                  className="position-relative"
                >
                  <i className="fas fa-bell"></i> Notification

                  {unreadCount > 0 && (
                    <span
                      className="position-absolute translate-middle d-flex align-items-center justify-content-center"
                      style={{
                        top: '5px',
                        left: '100%',
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
                </Dropdown.Toggle>

                <Dropdown.Menu
                  style={{
                    width: '320px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: 0,
                    border: 'none',
                    backgroundColor: '#fff'
                  }}
                >
                  {unreadCount > 0 && (
                    <Dropdown.Item
                      className="p-0 m-0 border-0"
                      onClick={() => dispatch(markAllNotificationsRead())}
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
                          // Ép cứng màu nền và màu chữ khi hover không cho thay đổi
                          e.currentTarget.style.backgroundColor = '#212529';
                          e.currentTarget.style.color = '#4dabf7';
                        }}
                      >
                        <i className="fas fa-check-double me-2"></i>
                        Mark all as read
                      </div>
                    </Dropdown.Item>
                  )}
                  {/* ----------------------------- */}

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
                      className="p-0 m-0 border-0"
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
              <Nav.Link>
                <i className="fas fa-comment"></i> Chat
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/chatbot">
              <Nav.Link>
                <i className="fas fa-message"></i> Chatbot
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/cart">
              <Nav.Link>
                <i className="fas fa-shopping-cart"></i>{' '}
                Cart {userInfo && `(${cartItems.reduce((a, c) => a + c.qty, 0)})`}
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/discounts">
              <Nav.Link>
                <i className="fas fa-tag"></i> Discounts
              </Nav.Link>
            </LinkContainer>

            {userInfo?.role === 'seller' && (
              <LinkContainer to="/seller/products">
                <Nav.Link>My Products</Nav.Link>
              </LinkContainer>
            )}

            {userInfo && (
              <NavDropdown title="Orders">
                <LinkContainer to="/orders">
                  <NavDropdown.Item>My Orders</NavDropdown.Item>
                </LinkContainer>
                {userInfo.role === 'seller' && (
                  <LinkContainer to="/seller/orders">
                    <NavDropdown.Item>My Sales</NavDropdown.Item>
                  </LinkContainer>
                )}
              </NavDropdown>
            )}

            {userInfo ? (
              <>
                <LinkContainer to="/profile">
                  <Nav.Link>{userInfo.name}</Nav.Link>
                </LinkContainer>
                <Nav.Link onClick={logoutHandler}>Logout</Nav.Link>
              </>
            ) : (
              <LinkContainer to="/login">
                <Nav.Link>
                  <i className="fas fa-user"></i> Sign In
                </Nav.Link>
              </LinkContainer>
            )}

            {userInfo?.isAdmin && (
              <>
                <LinkContainer to="/admin/userlist">
                  <Nav.Link>Shoppers</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/admin/productlist">
                  <Nav.Link>All Products</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/admin/orderlist">
                  <Nav.Link>All Orders</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/admin/discount/create">
                  <Nav.Link>Add Discount</Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
};