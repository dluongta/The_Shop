import axios from "axios";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Message from "../components/Message";
import Loader from "../components/Loader"; 

const ForgotPassword = () => {
    const [resetEmail, setResetEmail] = useState("");
    const [message, setMessage] = useState("");
    const [variant, setVariant] = useState("info");
    const [loading, setLoading] = useState(false);
    
    // Thêm state cho thời gian đếm ngược
    const [cooldown, setCooldown] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.message) {
            setResetEmail(location.state.message);
        }
    }, [location.state]);

    // Xử lý đếm ngược thời gian với localStorage để không mất khi F5
    useEffect(() => {
        const checkCooldown = () => {
            const storedTime = localStorage.getItem("forgot_pwd_cooldown");
            if (storedTime) {
                const remaining = Math.floor((parseInt(storedTime) - Date.now()) / 1000);
                if (remaining > 0) {
                    setCooldown(remaining);
                } else {
                    setCooldown(0);
                    localStorage.removeItem("forgot_pwd_cooldown");
                }
            }
        };

        checkCooldown(); // Kiểm tra ngay khi mount
        const interval = setInterval(checkCooldown, 1000); // Cập nhật mỗi giây
        
        return () => clearInterval(interval); // Cleanup
    }, []);

    // Hàm chuyển đổi giây sang định dạng mm:ss
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (cooldown > 0) return; // Chặn spam submit

        setLoading(true);
        setMessage("");

        try {
            const config = {
                headers: {
                    "Content-Type": "application/json",
                },
            };

            await axios.post(
                "/api/forgot-password",
                { email: resetEmail },
                config
            );

            setVariant("success");
            setMessage("Một liên kết đặt lại mật khẩu đã được gửi vào email của bạn.");
            setLoading(false);
            
            // Thiết lập thời gian chờ 3 phút (180 giây)
            localStorage.setItem("forgot_pwd_cooldown", Date.now() + 180 * 1000);
            setCooldown(180);

        } catch (error) {
            setLoading(false);
            setVariant("danger");
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
                        type="email"
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
                        disabled={loading || cooldown > 0}
                        style={{ 
                            width: '100%', padding: '12px', 
                            background: (loading || cooldown > 0) ? '#a5a5a5' : '#4f46e5', 
                            color: 'white', border: 'none', borderRadius: '5px', 
                            cursor: (loading || cooldown > 0) ? 'not-allowed' : 'pointer', 
                            fontWeight: 'bold' 
                        }}
                    >
                        {loading ? 'Đang xử lý...' : (cooldown > 0 ? `Vui lòng đợi ${formatTime(cooldown)}` : 'Gửi yêu cầu')}
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