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

// Nhận socket từ props (được truyền từ App.js)
export const NavBar = ({ socket }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // USER
  const { userInfo } = useSelector((state) => state.userLogin);

  // CART
  const { cartItems } = useSelector((state) => state.cart);

  // NOTIFICATIONS
  const notificationList = useSelector((state) => state.notificationList);
  const { notifications = [] } = notificationList;

  // Tính số lượng chưa đọc để hiển thị Badge số đỏ
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // 1. Fetch danh sách thông báo từ Database khi người dùng đăng nhập
  useEffect(() => {
    if (userInfo) {
      dispatch(listNotifications());
    }
  }, [dispatch, userInfo]);

  // 2. Lắng nghe sự kiện Socket để cập nhật thông báo thời gian thực
  useEffect(() => {
    if (!socket?.current || !userInfo) return;

    const handleNewNotification = (data) => {
      // Khi có tin nhắn mới, không dùng Toast nữa mà gọi action để cập nhật lại danh sách trong Dropdown
      dispatch(listNotifications());

      // Tùy chọn: Bạn có thể thêm hiệu ứng âm thanh nhỏ tại đây
      // const audio = new Audio('/sounds/notification_ping.mp3');
      // audio.play().catch(e => console.log("Audio play failed", e));
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
    // Đánh dấu là đã đọc trong Database
    dispatch(markNotificationRead(notification._id));

    // Chuyển hướng người dùng đến link liên kết (ví dụ: phòng chat)
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

            {/* PHẦN NOTIFICATION CỦA BẠN */}
            {userInfo && (
              <Dropdown align="end" className="me-3">
                <Dropdown.Toggle
                  variant="dark"
                  id="dropdown-notification"
                  className="position-relative"
                >
                  <i className="fas fa-bell"></i> Notification

                  {/* Hiển thị số lượng tin nhắn chưa đọc trên icon chuông */}
                  {unreadCount > 0 && (
                    <Badge
                      bg="danger"
                      pill
                      className="position-absolute top-0 start-100 translate-middle"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu
                  className="notification-menu"
                  style={{
                    width: '320px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }}
                >

                  {/* Nút đánh dấu tất cả đã đọc */}
                  {unreadCount > 0 && (
                    <>
                      <Dropdown.Item
                        className="notification-action text-center fw-bold"
                        onClick={() => dispatch(markAllNotificationsRead())}
                      >
                        <i className="fas fa-check-double me-2"></i>
                        Mark all as read
                      </Dropdown.Item>

                      <Dropdown.Divider />
                    </>
                  )}

                  {/* Trường hợp không có thông báo nào */}
                  {notifications.length === 0 && (
                    <Dropdown.Item className="notification-empty text-center">
                      Không có thông báo mới
                    </Dropdown.Item>
                  )}




                  {/* Hiển thị danh sách thông báo (Bao gồm cả tin nhắn mới từ Socket) */}
                  {notifications.map((n) => (
                    <Dropdown.Item
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        backgroundColor: n.isRead ? '#fff' : '#e7f1ff',
                        fontWeight: n.isRead ? 'normal' : 'bold',
                        whiteSpace: 'normal',
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      <div className="d-flex justify-content-between">
                        <span>{n.title}</span>
                        {!n.isRead && <Badge bg="primary" pill>New</Badge>}
                      </div>
                      <small className="text-muted d-block">{n.message}</small>
                      <div className="text-end text-muted" style={{ fontSize: '0.7rem' }}>
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </div>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}

            {/* CÁC MENU KHÁC GIỮ NGUYÊN */}
            <LinkContainer to="/chat">
              <Nav.Link>
                <i className="fas fa-comment"></i> Chat
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/chatbot">

              <Nav.Link>

                <i className="fas fa-message"></i> Chatbot              </Nav.Link>

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
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
};