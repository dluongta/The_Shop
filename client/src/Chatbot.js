import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { getAllDiscounts } from "./actions/discountActions";
import { getAllProducts } from "./actions/productActions";
import { getAllUsers } from "./actions/userActions";
import "./Chatbot.css";

function Chatbot() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTraining, setIsTraining] = useState(false);

  const dispatch = useDispatch();
  
  // Fetch lists of discounts, products, and users from Redux store
  const discountList = useSelector((state) => state.discountListAll);
  const productList = useSelector((state) => state.productListAll);
  const userList = useSelector((state) => state.userListAll);

  const { discounts } = discountList;
  const { products } = productList;
  const { users } = userList;

  useEffect(() => {
    dispatch(getAllDiscounts());
    dispatch(getAllProducts());
    dispatch(getAllUsers());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message) return;

    setIsLoading(true);
    setError(null);

    const newMessage = { sender: "user", text: message };
    setChatHistory((prevHistory) => [...prevHistory, newMessage]);
    setMessage("");

    try {
      // Gửi câu hỏi đến server API
      const response = await axios.post('/api/chat', {
        message: message,  // Chỉ gửi tin nhắn tiếng Việt
      });

      // Cập nhật câu trả lời của bot
      const botMessage = {
        sender: "bot",
        text: response.data.answer || "Bot không có câu trả lời cho câu hỏi này.",
      };
      setChatHistory((prevHistory) => [...prevHistory, botMessage]);
    } catch (error) {
      setError("Có lỗi xảy ra khi gửi yêu cầu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrainBot = async () => {
    setIsTraining(true);
    setError(null);
    try {
      // Gửi yêu cầu huấn luyện bot
      await axios.post('/api/train');
      alert('Chatbot đã được huấn luyện thành công!');
    } catch (error) {
      setError("Có lỗi xảy ra khi huấn luyện chatbot.");
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="app-container">
      <div className="chat-box">
        <h1>Chatbot</h1>

        <button onClick={handleTrainBot} disabled={isTraining}>
          {isTraining ? "Đang huấn luyện..." : "Huấn luyện lại bot"}
        </button>

        <div className="chat-history">
          {chatHistory.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              {message.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="input-container">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập câu hỏi của bạn..."
            className="input-field"
          />
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Đang gửi..." : "Gửi"}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default Chatbot;
