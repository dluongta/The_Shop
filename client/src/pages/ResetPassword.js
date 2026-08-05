import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Message from "../components/Message";
import axios from "axios";

const ResetPassword = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // State mới để quản lý việc đếm ngược
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Xử lý đếm ngược khi isSuccess = true
  useEffect(() => {
    let timer;
    if (isSuccess && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      navigate("/login");
    }
    return () => clearInterval(timer);
  }, [isSuccess, countdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`/api/reset-password/${id}/${token}`, {
        password,
      });

      if (response.data.status === "Password Updated Succeeded") {
        setIsSuccess(true);
        setMessage("Đổi mật khẩu thành công! Đang chuyển hướng sau vài giây...");
      } else {
        setMessage(response.data.status);
      }
    } catch (error) {
      setMessage("Liên kết đã hết hạn hoặc có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Thiết lập mật khẩu mới
          </h2>
        </div>

        {message && (
          <div className={isSuccess ? "" : "animate-pulse"}>
            <Message variant={isSuccess || message.includes("thành công") ? 'success' : 'danger'}>
              {message} {isSuccess && `(${countdown}s)`}
            </Message>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
              <input
                type="password"
                required
                disabled={isSuccess} // Khóa input khi đã thành công
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
              <input
                type="password"
                required
                disabled={isSuccess} // Khóa input khi đã thành công
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || isSuccess}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white transition-all transform active:scale-95 ${loading || isSuccess
                  ? "bg-blue-600 opacity-60 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                }`}
            >
              Cập nhật mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;