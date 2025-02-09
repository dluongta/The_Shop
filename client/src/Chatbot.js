import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Chatbot.css";

function Chatbot() {
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const discounts = [
        {
            code: 'DISCOUNT10',
            description: '10% off your next purchase',
            amount: 10,
            isActive: true,
        },
        {
            code: 'DISCOUNT20',
            description: '20% off your next purchase',
            amount: 20,
            isActive: true,
        },
        {
            code: 'SALE10',
            description: '10% off sale items',
            amount: 10,
            isActive: true,
        },
    ];
    const products = [
        {
            name: 'Airpods Wireless Bluetooth Headphones',
            image: '/images/airpods.jpg',
            description:
                'Bluetooth technology lets you connect it with compatible devices wirelessly High-quality AAC audio offers immersive listening experience Built-in microphone allows you to take calls while working',
            brand: 'Apple',
            category: 'Phone Accessories',
            price: 89.99,
            countInStock: 3,
            rating: 0,
            numReviews: 0,
        },
        {
            name: 'iPhone 11 Pro 256GB Memory',
            image: '/images/phone.jpg',
            description:
                'Introducing the iPhone 11 Pro. A transformative triple-camera system that adds tons of capability without complexity. An unprecedented leap in battery life',
            brand: 'Apple',
            category: 'Smartphone',
            price: 599.99,
            countInStock: 10,
            rating: 0,
            numReviews: 0,
        },
        {
            name: 'Cannon EOS 80D DSLR Camera',
            image: '/images/camera.jpg',
            description:
                'Characterized by versatile imaging specs, the Canon EOS 80D further clarifies itself using a pair of robust focusing systems and an intuitive design',
            brand: 'Cannon',
            category: 'Media',
            price: 929.99,
            countInStock: 0,
            rating: 0,
            numReviews: 0,
        },
        {
            name: 'Sony Playstation 4 Pro White Version',
            image: '/images/playstation.jpg',
            description:
                'The ultimate home entertainment center starts with PlayStation. Whether you are into gaming, HD movies, television, music',
            brand: 'Sony',
            category: 'Gaming',
            price: 399.99,
            countInStock: 10,
            rating: 0,
            numReviews: 0,
        },
        {
            name: 'Logitech G-Series Gaming Mouse',
            image: '/images/mouse.jpg',
            description:
                'Get a better handle on your games with this Logitech LIGHTSYNC gaming mouse. The six programmable buttons allow customization for a smooth playing experience',
            brand: 'Logitech',
            category: 'Electronics',
            price: 49.99,
            countInStock: 7,
            rating: 0,
            numReviews: 0,
        },
        {
            name: 'Amazon Echo Dot 3rd Generation',
            image: '/images/alexa.jpg',
            description:
                'Meet Echo Dot - Our most popular smart speaker with a fabric design. It is our most compact smart speaker that fits perfectly into small space',
            brand: 'Amazon',
            category: 'Electronics',
            price: 29.99,
            countInStock: 0,
            rating: 0,
            numReviews: 0,

        },
        {
            name: 'DELL XPS',
            image: '/images/laptop.png',
            description:
                'High quality with impressive display and sound',
            brand: 'DELL',
            category: 'Electronics',
            price: 599.99,
            countInStock: 10,
            rating: 5,
            numReviews: 1,
            reviews: [{
                _id: '65f30ca6103e860041ed185d',
                name: "Jane",
                rating: 5,
                comment: "Good",
                user: '65f2da2354a4dd16902dd94e',
                createdAt: '2024-03-14T14:41:42.442+00:00',
                updatedAt: '2024-03-14T14:41:42.442+00:00',
            },]
        },
        {
            name: 'Iphone',
            image: '/images/iphone.jpg',
            description:
                'High Quality Iphone',
            brand: 'Apple',
            category: 'Electronics',
            price: 99.99,
            countInStock: 10,
            rating: 5,
            numReviews: 1,
            reviews: [{
                _id: '65f30ca6103e860041ed185d',
                name: "Jane",
                rating: 5,
                comment: "Good",
                user: '65f2da2354a4dd16902dd94e',
                createdAt: '2024-03-14T14:41:42.442+00:00',
                updatedAt: '2024-03-14T14:41:42.442+00:00',
            },]
        },
        {
            name: 'Computer Keyboard',
            image: '/images/keyboard.jpg',
            description:
                'Compatible with most of computer devices',
            brand: 'DELL',
            category: 'Electronics',
            price: 29.99,
            countInStock: 10,
            rating: 5,
            numReviews: 1,
            reviews: [{
                _id: '65f30ca6103e860041ed185d',
                name: "Jane",
                rating: 5,
                comment: "Good",
                user: '65f2da2354a4dd16902dd94e',
                createdAt: '2024-03-14T14:41:42.442+00:00',
                updatedAt: '2024-03-14T14:41:42.442+00:00',
            },]
        },

    ]
    const users = [
        {
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'seller',
            isAdmin: true,
            discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],
            paypalClientId: 'AfW47Nj0c4k_bHHB5Kn1a0EYKCoe5nBDxG_fcraZiuEoSyxC9IRvBn7kIj6Qkcy7o3lU18TVYZzt9Nid'
        },
        {
            name: 'John Street',
            email: 'john@example.com',
            role: 'buyer',
            discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],
            paypalClientId: 'AfW47Nj0c4k_bHHB5Kn1a0EYKCoe5nBDxG_fcraZiuEoSyxC9IRvBn7kIj6Qkcy7o3lU18TVYZzt9Nid'

        },
        {
            name: 'Jane Street',
            email: 'jane@example.com',
            role: 'seller',
            discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],
            paypalClientId: 'AfW47Nj0c4k_bHHB5Kn1a0EYKCoe5nBDxG_fcraZiuEoSyxC9IRvBn7kIj6Qkcy7o3lU18TVYZzt9Nid'
        },
    ];

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

    // Set initial bot data with discounts, products, and users
    useEffect(() => {
        const fetchBotInitialData = async () => {
            try {
                console.log("Starting API request...");
                await axios.post(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyAJC7L9bXORVgkjqQrF0Ta9mYDceu5mSYE",
                    {
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `
                        Bây giờ bạn tên là Trợ lý của The Shop. Bạn chỉ trả lời các câu hỏi liên quan đến giá, mã giảm giá, sản phẩm, người dùng và các câu hỏi liên quan, nếu không liên quan thì trả lời "Không trong lĩnh vực của ứng dụng The Shop".
                        Dữ liệu mã giảm giá, người dùng, sản phẩm được cho như sau:
    
                        Mã giảm giá:
                        ${discounts.map(d => `Code-${d.code}: Description-${d.description}, Amount-${d.amount}, IsActive-${d.isActive}`).join("\n")}
    
                        Sản phẩm:
                        ${products.map(p => `Name-${p.name}: Price-${p.price} USD, Description-${p.description}, Brand-${p.brand}, Category-${p.category}, countInStock-${p.countInStock}`).join("\n")}
    
                        Người dùng:
                        ${users.map(u => `Name-${u.name}: Email-${u.email}, Role-${u.role}, IsAdmin-${u.isAdmin}`).join("\n")}
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
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyAJC7L9bXORVgkjqQrF0Ta9mYDceu5mSYE",
                {
                    contents: [{
                        parts: [{
                            text: message + `
                        Bây giờ bạn tên là Trợ lý của The Shop. Bạn chỉ trả lời các câu hỏi liên quan đến giá, mã giảm giá, sản phẩm, người dùng và các câu hỏi liên quan, nếu không liên quan thì trả lời "Không trong lĩnh vực của ứng dụng The Shop".
                        Dữ liệu mã giảm giá, người dùng, sản phẩm được cho như sau:
    
                        Mã giảm giá:
                        ${discounts.map(d => `Code-${d.code}: Description-${d.description}, Amount-${d.amount}, IsActive-${d.isActive}`).join("\n")}
    
                        Sản phẩm:
                        ${products.map(p => `Name-${p.name}: Price-${p.price} USD, Description-${p.description}, Brand-${p.brand}, Category-${p.category}, countInStock-${p.countInStock}`).join("\n")}
    
                        Người dùng:
                        ${users.map(u => `Name-${u.name}: Email-${u.email}, Role-${u.role}, IsAdmin-${u.isAdmin}`).join("\n")}
                        ` }]
                    }],
                },
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

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
