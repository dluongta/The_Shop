import axios from 'axios';

const sendEmail = async ({ to, subject, html }) => {

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

  try {

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

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Message:', error.message);
    }

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