import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllDiscounts } from "./actions/discountActions";
import { getAllProducts } from "./actions/productActions";
import { getAllUsers } from "./actions/userActions";
import axios from "axios";
import "./Chatbot.css";

function Chatbot() {
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const dispatch = useDispatch();

    // Access the state from Redux store
    const discountList = useSelector((state) => state.discountListAll);
    const productList = useSelector((state) => state.productListAll);
    const userList = useSelector((state) => state.userListAll);

    const { discounts } = discountList;
    const { products } = productList;
    const { users } = userList;

    // Ensure safe defaults if the data is not yet available
    const discountsList = discounts && Array.isArray(discounts) ? discounts : [];
    const allProducts = products && Array.isArray(products) ? products : [];
    const usersList = users && Array.isArray(users) ? users : [];

    useEffect(() => {
        dispatch(getAllDiscounts());
        dispatch(getAllProducts());
        dispatch(getAllUsers());
    }, [dispatch]);

    const formatBotResponse = (text) => {
        return text
            .replace(/\*\s\**(.*?)\*\*/g, "<h5><b>$1</b></h5>")  // Format **bold text**
            .replace(/\*(.*?)\*/g, "<h4><b>$1</b></h4>")         // Format *bold text*
            .replace(/```([\s\S]*?)```/g, (match, code) => {
                return `<pre><code>${code}</code><button class="copy-button">📋</button></pre>`;  // Format code blocks
            })
            .replace(/`(.*?)`/g, "<code>$1</code>");               // Format inline code
    };

    // Event listener cleanup for copy functionality
    useEffect(() => {
        const handleCopyButtonClick = (event) => {
            if (event.target.classList.contains("copy-button")) {
                const codeElement = event.target.previousElementSibling;
                if (codeElement) {
                    navigator.clipboard.writeText(codeElement.innerText).then(() => {
                        event.target.textContent = "✔️";
                        setTimeout(() => (event.target.textContent = "📋"), 2000);
                    });
                }
            }
        };

        document.addEventListener("click", handleCopyButtonClick);

        return () => {
            document.removeEventListener("click", handleCopyButtonClick);
        };
    }, []);

    // Fetch data on component mount and update the bot's knowledge
    useEffect(() => {
        const fetchBotInitialData = async () => {
            try {
                console.log("Starting API request...");
                await axios.post(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAJC7L9bXORVgkjqQrF0Ta9mYDceu5mSYE",
                    {
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `
                    Bây giờ bạn tên là Trợ lý của The Shop. Bạn chỉ trả lời các câu hỏi liên quan đến giá, mã giảm giá, sản phẩm, người dùng và các câu hỏi liên quan như tính toán, gợi ý và các vấn đề khác, nếu không liên quan thì trả lời "Không trong lĩnh vực của ứng dụng The Shop". 
                    Dữ liệu mã giảm giá, người dùng, sản phẩm được cho như sau:
        
                    Mã giảm giá:
                    ${discountsList.map(d => `Code-${d.code}: Description-${d.description}, Amount-${d.amount}, IsActive-${d.isActive}`).join("\n")}
        
                    Sản phẩm:
                    ${allProducts.map(p => `Name-${p.name}: Price-${p.price} USD, Description-${p.description}, Brand-${p.brand}, Category-${p.category}, countInStock-${p.countInStock}`).join("\n")}
        
                    Người dùng:
                    ${usersList.map(u => `Name-${u.name}: Email-${u.email}, Role-${u.role}, IsAdmin-${u.isAdmin}`).join("\n")}
                    `,
                                    },
                                ],
                            },
                        ],
                    },
                    { headers: { "Content-Type": "application/json" } }
                );
                console.log("API request successful!");
            } catch (error) {
                console.error("Error during initial API request:", error);
            }
        };

        fetchBotInitialData(); // Gọi API chỉ một lần khi component mount
    }, []);  // Mảng phụ thuộc rỗng đảm bảo API chỉ gọi một lần khi component mount

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message) return;

        setIsLoading(true);
        setError(null);

        const newMessage = { sender: "user", text: message };
        setChatHistory((prevHistory) => [...prevHistory, newMessage]);
        setMessage("");

        let isMounted = true;

        try {
            const response = await axios.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAJC7L9bXORVgkjqQrF0Ta9mYDceu5mSYE",
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: message + `
                                    Bây giờ bạn tên là Trợ lý của The Shop. Bạn chỉ trả lời các câu hỏi liên quan đến giá, mã giảm giá, sản phẩm, người dùng và các câu hỏi liên quan như tính toán, gợi ý và các vấn đề khác, nếu không liên quan thì trả lời "Không trong lĩnh vực của ứng dụng The Shop".
                                    Dữ liệu mã giảm giá, người dùng, sản phẩm được cho như sau:
                
                                    Mã giảm giá:
                                    ${discountsList.map(d => `Code-${d.code}: Description-${d.description}, Amount-${d.amount}, IsActive-${d.isActive}`).join("\n")}
                
                                    Sản phẩm:
                                    ${allProducts.map(p => `Name-${p.name}: Price-${p.price} USD, Description-${p.description}, Brand-${p.brand}, Category-${p.category}, countInStock-${p.countInStock}`).join("\n")}
                
                                    Người dùng:
                                    ${usersList.map(u => `Name-${u.name}: Email-${u.email}, Role-${u.role}, IsAdmin-${u.isAdmin}`).join("\n")}
                                    ` }
                            ]
                        }
                    ],
                },
                {
                    headers: { "Content-Type": "application/json" },
                }
            );
            console.log(response)
            if (isMounted) {
                const botMessage = {
                    sender: "bot",
                    text: formatBotResponse(response.data.candidates[0].content.parts[0].text),
                };
                setChatHistory((prevHistory) => [...prevHistory, botMessage]);
            }
        } catch (error) {
            console.error("Error during API call:", error);
            if (isMounted) {
                if (error.response) {
                    setError("Có lỗi xảy ra: " + error.response.data.message);
                } else {
                    setError("Lỗi kết nối. Vui lòng kiểm tra lại.");
                }
            }
        } finally {
            if (isMounted) setIsLoading(false);
        }

        return () => {
            isMounted = false;
        };
    };

    return (
        <div className="app-container">
            <div className="chat-box">
                <h1>Chatbot</h1>

                <div className="chat-history">
                    {chatHistory.map((message, index) => (
                        <div
                            key={index}
                            className={`message ${message.sender}`}
                            dangerouslySetInnerHTML={{ __html: message.text }}
                        />
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
