import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Message from "../components/Message";
import "./ResetPassword.css";

const ResetPassword = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isSuccess) return;

    if (countdown === 0) {
      navigate("/login");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
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
      const response = await axios.post(
        `/api/reset-password/${id}/${token}`,
        {
          password,
        }
      );

      if (response.data.status === "Password Updated Succeeded") {
        setIsSuccess(true);
        setMessage(
          "Đổi mật khẩu thành công! Đang chuyển hướng đến trang đăng nhập..."
        );
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
    <div className="reset-page">
      {/* Background */}
      <div className="reset-bg">
        <div className="reset-bg-circle reset-bg-circle-1"></div>
        <div className="reset-bg-circle reset-bg-circle-2"></div>
      </div>

      <main className="reset-main">
        <div className="reset-card">

          {/* Logo / Icon */}
          <div className="reset-header">
            <div
              className={`reset-icon ${
                isSuccess ? "reset-icon-success" : ""
              }`}
            >
              {isSuccess ? (
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12.5L9.5 17L19 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none">
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M8 10V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="12"
                    cy="15"
                    r="1"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>

            <h1>
              {isSuccess
                ? "Mật khẩu đã được cập nhật"
                : "Thiết lập mật khẩu mới"}
            </h1>

            <p>
              {isSuccess
                ? "Tài khoản của bạn đã được bảo mật bằng mật khẩu mới."
                : "Tạo một mật khẩu mới để bảo vệ tài khoản của bạn."}
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className="reset-message">
              <Message
                variant={
                  isSuccess || message.includes("thành công")
                    ? "success"
                    : "danger"
                }
              >
                <div className="reset-message-content">
                  <span>{message}</span>

                  {isSuccess && (
                    <strong>{countdown}s</strong>
                  )}
                </div>
              </Message>
            </div>
          )}

          {/* Form */}
          {!isSuccess && (
            <form
              className="reset-form"
              onSubmit={handleSubmit}
            >
              {/* Password */}
              <div className="reset-field">
                <label htmlFor="password">
                  Mật khẩu mới
                </label>

                <div className="reset-input-wrapper">
                  <span className="reset-input-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="10"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M8 10V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V10"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>

                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="reset-field">
                <label htmlFor="confirmPassword">
                  Xác nhận mật khẩu
                </label>

                <div className="reset-input-wrapper">
                  <span className="reset-input-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 3L19 6V11C19 15.5 16.1 19.4 12 21C7.9 19.4 5 15.5 5 11V6L12 3Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 12L11 14L15 10"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Nhập lại mật khẩu"
                  />
                </div>
              </div>

              {/* Password tip */}
              <div className="reset-tip">
                <div className="reset-tip-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M12 10V16"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="12"
                      cy="7"
                      r="1"
                      fill="currentColor"
                    />
                  </svg>
                </div>

                <p>
                  Sử dụng mật khẩu mạnh và không sử dụng lại
                  mật khẩu ở những tài khoản khác.
                </p>
              </div>

              {/* Button */}
              <button
                type="submit"
                className="reset-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="reset-spinner"></span>
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <span>Cập nhật mật khẩu</span>

                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12H19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M13 6L19 12L13 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Success */}
          {isSuccess && (
            <div className="reset-success">
              <div className="reset-success-info">
                <span>
                  Chuyển đến trang đăng nhập
                </span>

                <strong>{countdown}s</strong>
              </div>

              <div className="reset-progress">
                <div
                  style={{
                    width: `${(countdown / 5) * 100}%`,
                  }}
                ></div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="reset-login-button"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}

          {/* Security */}
          <div className="reset-security">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3L19 6V11C19 15.5 16.1 19.4 12 21C7.9 19.4 5 15.5 5 11V6L12 3Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M9 12L11 14L15 10"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span>
              Thông tin của bạn được bảo mật an toàn
            </span>
          </div>
        </div>

        <div className="reset-copyright">
          © {new Date().getFullYear()} The Shop. All rights reserved.
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
