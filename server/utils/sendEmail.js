import axios from 'axios';

/**
 * Gửi email qua Brevo REST API
 *
 * Required ENV:
 * BREVO_API_KEY=your_brevo_api_key
 * BREVO_SENDER_EMAIL=your_verified_email
 * BREVO_SENDER_NAME=The Digital Shop
 */
const sendEmail = async ({ to, subject, html }) => {
  // ==============================
  // 1. Kiểm tra ENV
  // ==============================
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail =
    process.env.BREVO_SENDER_EMAIL || 'luen2k3@gmail.com';
  const senderName =
    process.env.BREVO_SENDER_NAME || 'The Digital Shop';

  if (!apiKey) {
    throw new Error(
      'BREVO_API_KEY chưa được cấu hình trong file .env'
    );
  }

  if (!to) {
    throw new Error('Email người nhận không hợp lệ');
  }

  console.log('========== BREVO EMAIL DEBUG ==========');
  console.log('API KEY exists:', !!apiKey);
  console.log('API KEY length:', apiKey.length);
  console.log('API KEY prefix:', apiKey.substring(0, 10) + '...');
  console.log('Sender:', senderEmail);
  console.log('Receiver:', to);
  console.log('Subject:', subject);
  console.log('========================================');

  try {
    // ==============================
    // 2. Gọi trực tiếp Brevo API
    // ==============================
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: senderName,
          email: senderEmail,
        },

        to: [
          {
            email: to,
          },
        ],

        subject,
        htmlContent: html,
      },
      {
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },

        timeout: 15000,
      }
    );

    console.log('========== BREVO SUCCESS ==========');
    console.log('Message ID:', response.data?.messageId);
    console.log('===================================');

    return response.data;
  } catch (error) {
    console.error('========== BREVO ERROR ==========');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Message:', error.message);
    }

    console.error('=================================');

    // Lấy message chi tiết từ Brevo
    const brevoMessage =
      error.response?.data?.message ||
      error.response?.data?.code ||
      error.message;

    throw new Error(
      `Brevo ${error.response?.status || ''}: ${brevoMessage}`
    );
  }
};

export default sendEmail;