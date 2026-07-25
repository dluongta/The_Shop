import axios from "axios";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Message from "../components/Message";
import Loader from "../components/Loader"; // Đảm bảo bạn có component Loader

const ForgotPassword = () => {
    const [resetEmail, setResetEmail] = useState("");
    const [message, setMessage] = useState("");
    const [variant, setVariant] = useState("info");
    const [loading, setLoading] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.message) {
            setResetEmail(location.state.message);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(""); // Xóa thông báo cũ

        try {
            const config = {
                headers: {
                    "Content-Type": "application/json",
                },
            };

            const { data } = await axios.post(
                "/api/forgot-password",
                { email: resetEmail },
                config
            );

            setVariant("success");
            setMessage("Một liên kết đặt lại mật khẩu đã được gửi vào email của bạn.");
            setLoading(false);
            
            // Tùy chọn: Tự động chuyển hướng sau 3 giây
            // setTimeout(() => navigate('/login'), 3000);

        } catch (error) {
            setLoading(false);
            setVariant("danger");
            
            // FIX LỖI: Lấy thông báo lỗi cụ thể từ Backend trả về
            const errorMsg = error.response && error.response.data.status
                ? (error.response.data.status === "User Not Exists!!" 
                    ? "Email này không tồn tại trong hệ thống." 
                    : error.response.data.status)
                : "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
            
            setMessage(errorMsg);
        }
    };

    return (
        <div className="form-container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="box-container" style={{ maxWidth: '450px', width: '100%', margin: '0 auto', padding: '20px' }}>
                
                <h1 className="title" style={{ textAlign: 'center', marginBottom: '20px', fontSize: '2rem', color: '#333' }}>
                    Quên mật khẩu
                </h1>

                {message && <Message variant={variant}>{message}</Message>}
                {loading && <Loader />}

                <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                    <p style={{ marginBottom: '15px', color: '#666', fontSize: '1.4rem' }}>
                        Nhập email đăng ký của bạn để nhận liên kết khôi phục.
                    </p>

                    <input
                        type="email" // Đổi text thành email để browser tự validate format
                        name="email"
                        required
                        placeholder="Ví dụ: admin@example.com"
                        className="box"
                        style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px' }}
                        onChange={(e) => setResetEmail(e.target.value)}
                        value={resetEmail}
                    />

                    <button 
                        type="submit" 
                        className="btn" 
                        disabled={loading}
                        style={{ width: '100%', padding: '12px', background: '#4f46e5', color: '#white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                    </button>
                    
                    <div style={{ marginTop: '15px', textAlign: 'center' }}>
                        <span 
                            onClick={() => navigate('/login')} 
                            style={{ color: '#4f46e5', cursor: 'pointer', fontSize: '1.3rem' }}
                        >
                            Quay lại đăng nhập
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;