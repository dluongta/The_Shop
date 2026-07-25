import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import HomeScreen from "./pages/HomeScreen";
import ProductScreen from "./pages/ProductScreen";
import CartScreen from "./pages/CartScreen";
import LoginScreen from "./pages/LoginScreen";
import RegisterScreen from "./pages/RegisterScreen";
import ProfileScreen from "./pages/ProfileScreen";
import ShippingScreen from "./pages/ShippingScreen";
import PaymentScreen from "./pages/PaymentScreen";
import PlaceOrderScreen from "./pages/PlaceOrderScreen";
import OrderScreen from "./pages/OrderScreen";
import UserListScreen from "./pages/UserListScreen";
import UserEditScreen from "./pages/UserEditScreen";
import ProductListScreen from "./pages/ProductListScreen";
import ProductEditScreen from "./pages/ProductEditScreen";
import OrderListScreen from "./pages/OrderListScreen";
import DiscountListScreen from "./pages/DiscountListScreen";
import BuyOrdersScreen from "./pages/BuyOrdersScreen";
import SellOrdersScreen from "./pages/SellOrdersScreen";
import AdminProductList from "./pages/AdminProductList";
import ChatLayout from "./components/ChatLayout";
import Chatbot from "./Chatbot";

import { AuthProvider } from "./contexts/AuthContext";
import { NavBar } from "./layout/NavBar";
import Footer from "./layout/Footer";

import socket from "./socket";
import { addNotification } from "./actions/notificationActions";
import ForgotPassword from "./layouts/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DiscountCreateScreen from "./pages/DiscountCreateScreen";

const Header = () => {
  const location = useLocation();

  if (location.pathname === "/chat") return null;

  return <NavBar />;
};

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const isChat = location.pathname === "/chat";

  const [appHeight, setAppHeight] = useState(window.innerHeight);

  useEffect(() => {
    const updateHeight = () => {
      setAppHeight(window.innerHeight);
    };

    updateHeight();

    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  return (
    <>
      <Header />

      <main
        className={isChat ? "chat-main" : ""}
        style={
          isChat
            ? {
              height: window.innerHeight,
              minHeight: 0,
              overflow: "hidden"
            }
            : {}
        }
      >
        {children}
      </main>

      {!isChat && <Footer />}
    </>
  );
};

const App = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.userLogin);

  useEffect(() => {
    if (!userInfo) return;

    socket.connect();
    socket.emit("addUser", userInfo._id);

    socket.on("newNotification", (notification) => {
      dispatch(addNotification(notification));
    });

    return () => {
      socket.off("newNotification");
      socket.disconnect();
    };
  }, [userInfo, dispatch]);

  return (
    <AuthProvider>
      <Router>
        <LayoutWrapper>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/product/:id" element={<ProductScreen />} />
            <Route path="/cart/:id?" element={<CartScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/shipping" element={<ShippingScreen />} />
            <Route path="/payment" element={<PaymentScreen />} />
            <Route path="/placeorder" element={<PlaceOrderScreen />} />
            <Route path="/order/:id" element={<OrderScreen />} />

            <Route path="/admin/userlist" element={<UserListScreen />} />
            <Route path="/admin/user/:id/edit" element={<UserEditScreen />} />
            <Route path="/admin/orderlist" element={<OrderListScreen />} />
            <Route path="/admin/productlist" element={<AdminProductList />} />
            <Route
              path="/admin/product/:id/edit"
              element={<ProductEditScreen />}
            />

            <Route
              path="/seller/products"
              element={<ProductListScreen />}
            />
            <Route
              path="/seller/products/:id/edit"
              element={<ProductEditScreen />}
            />
            <Route path="/seller/orders" element={<SellOrdersScreen />} />

            <Route path="/search/:keyword" element={<HomeScreen />} />
            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />
            <Route
              path="/reset-password/:id/:token"
              element={<ResetPassword />}
            />
            <Route path="/orders" element={<BuyOrdersScreen />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route
              path="/discounts"
              element={<DiscountListScreen />}
            />
            <Route
              path="/admin/discount/create"
              element={<DiscountCreateScreen />}
            />

            <Route
              path="/chat"
              element={
                userInfo ? <ChatLayout /> : <Navigate to="/login" />
              }
            />
          </Routes>
        </LayoutWrapper>
      </Router>
    </AuthProvider>
  );
};

export default App;