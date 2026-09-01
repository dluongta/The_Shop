import asyncHandler from 'express-async-handler';
import generateToken from '../utils/generateToken.js';
import User from '../models/userModel.js';
import sendEmail from '../utils/sendEmail.js';

/* =========================================================
   EMAIL OTP TEMPLATE
========================================================= */
const createOtpEmail = ({ name, otp, resend = false }) => {
  const title = resend
    ? 'Mã xác thực mới của bạn'
    : 'Xác thực tài khoản của bạn';

  const greeting = resend
    ? `Mã xác thực mới của bạn là:`
    : `Cảm ơn ${name} đã đăng ký tài khoản tại The Digital Shop.`;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background-color:#f4f7fb;
  font-family:Arial, Helvetica, sans-serif;
  color:#333333;
">

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background-color:#f4f7fb; padding:35px 15px;"
  >
    <tr>
      <td align="center">

        <!-- MAIN CONTAINER -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:600px;
            background-color:#ffffff;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 4px 18px rgba(0,0,0,0.08);
          "
        >

          <!-- HEADER -->
          <tr>
            <td
              align="center"
              style="
                background-color:#0d6efd;
                padding:28px 20px;
              "
            >
              <div style="
                color:#ffffff;
                font-size:25px;
                font-weight:bold;
                line-height:1.4;
              ">
                The Digital Shop
              </div>

              <div style="
                color:#ffffff;
                font-size:17px;
                margin-top:7px;
                line-height:1.5;
              ">
                ${title}
              </div>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:35px 35px 30px 35px;">

              <!-- TITLE -->
              <div style="
                font-size:23px;
                font-weight:bold;
                color:#222222;
                margin-bottom:20px;
                line-height:1.4;
              ">
                ${title}
              </div>

              <!-- GREETING -->
              <div style="
                font-size:17px;
                line-height:1.7;
                color:#444444;
                margin-bottom:18px;
              ">
                ${greeting}
              </div>

              ${
                resend
                  ? `
                    <div style="
                      font-size:17px;
                      line-height:1.7;
                      color:#444444;
                      margin-bottom:18px;
                    ">
                      Vui lòng sử dụng mã bên dưới để tiếp tục xác thực tài khoản:
                    </div>
                  `
                  : `
                    <div style="
                      font-size:17px;
                      line-height:1.7;
                      color:#444444;
                      margin-bottom:18px;
                    ">
                      Vui lòng sử dụng mã xác thực bên dưới để hoàn tất quá trình đăng ký:
                    </div>
                  `
              }

              <!-- OTP BOX -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="margin:25px 0;"
              >
                <tr>
                  <td align="center">

                    <div style="
                      background-color:#eef5ff;
                      border:2px solid #0d6efd;
                      border-radius:10px;
                      padding:22px 15px;
                    ">

                      <div style="
                        font-size:16px;
                        color:#555555;
                        margin-bottom:10px;
                        line-height:1.5;
                      ">
                        MÃ XÁC THỰC
                      </div>

                      <div style="
                        font-size:36px;
                        font-weight:bold;
                        letter-spacing:8px;
                        color:#0d6efd;
                        line-height:1.3;
                      ">
                        ${otp}
                      </div>

                    </div>

                  </td>
                </tr>
              </table>

              <!-- EXPIRE -->
              <div style="
                font-size:17px;
                line-height:1.7;
                color:#444444;
                margin-top:20px;
              ">
                Mã xác thực này có hiệu lực trong
                <strong style="color:#222222;">
                  10 phút
                </strong>.
              </div>

              <div style="
                font-size:17px;
                line-height:1.7;
                color:#444444;
                margin-top:10px;
              ">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
              </div>

              <!-- DIVIDER -->
              <div style="
                border-top:1px solid #e5e5e5;
                margin:28px 0 20px 0;
              "></div>

              <!-- SECURITY NOTE -->
              <div style="
                font-size:15px;
                line-height:1.6;
                color:#777777;
              ">
                Vì lý do bảo mật, vui lòng không chia sẻ mã xác thực này
                với bất kỳ người nào khác.
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td
              align="center"
              style="
                background-color:#f8f9fa;
                padding:20px;
                border-top:1px solid #eeeeee;
              "
            >

              <div style="
                font-size:15px;
                color:#777777;
                line-height:1.6;
              ">
                © ${new Date().getFullYear()} The Digital Shop
              </div>

              <div style="
                font-size:14px;
                color:#999999;
                margin-top:5px;
              ">
                Email tự động, vui lòng không trả lời email này.
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
};


/* =========================================================
   LOGIN
========================================================= */
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (!user.isVerified) {
      res.status(401);

      throw new Error(
        'Tài khoản chưa được xác thực. Vui lòng đăng ký lại để nhận mã hoặc kiểm tra email!'
      );
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      paypalClientId: user.paypalClientId,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Email hoặc mật khẩu không hợp lệ');
  }
});


/* =========================================================
   REGISTER
========================================================= */
const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    paypalClientId,
    isGoogleAuth,
  } = req.body;

  const cleanEmail = email.trim().toLowerCase();

  /* -----------------------------------------
     CHECK USER EXIST
  ----------------------------------------- */
  const userExists = await User.findOne({
    email: cleanEmail,
  });

  if (userExists) {
    if (userExists.isVerified) {
      res.status(400);
      throw new Error('Email này đã được sử dụng!');
    } else {
      // Xóa tài khoản chưa xác thực cũ
      await User.deleteOne({
        email: cleanEmail,
      });
    }
  }

  /* -----------------------------------------
     GOOGLE AUTH
  ----------------------------------------- */
  const isVerified = isGoogleAuth === true;

  /* -----------------------------------------
     OTP
  ----------------------------------------- */
  const verificationCode = isVerified
    ? undefined
    : Math.floor(
        100000 + Math.random() * 900000
      ).toString();

  const verificationCodeExpires = isVerified
    ? undefined
    : Date.now() + 10 * 60 * 1000;

  /* -----------------------------------------
     CREATE USER
  ----------------------------------------- */
  const user = await User.create({
    name,
    email: cleanEmail,
    password,
    role,
    paypalClientId,
    isVerified,
    verificationCode,
    verificationCodeExpires,
  });

  if (!user) {
    res.status(400);
    throw new Error('Dữ liệu người dùng không hợp lệ');
  }

  /* =====================================================
     GOOGLE REGISTER
  ===================================================== */
  if (isVerified) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      paypalClientId: user.paypalClientId,
      token: generateToken(user._id),
    });

    return;
  }

  /* =====================================================
     SEND OTP EMAIL
  ===================================================== */
  try {
    await sendEmail({
      to: cleanEmail,

      subject:
        'Mã xác thực tài khoản - The Digital Shop',

      html: createOtpEmail({
        name: user.name,
        otp: verificationCode,
      }),
    });

    console.log(
      '\n=========================================='
    );

    console.log(
      `MÃ OTP ĐĂNG KÝ CỦA ${cleanEmail}: ${verificationCode}`
    );

    console.log(
      '==========================================\n'
    );

    res.status(201).json({
      requiresVerification: true,
      email: user.email,
    });

  } catch (error) {

    console.error(
      'BREVO SEND EMAIL ERROR:',
      error
    );

    // Nếu gửi mail thất bại thì xóa user
    await User.findByIdAndDelete(user._id);

    res.status(500);

    throw new Error(
      `Lỗi hệ thống gửi mail Brevo: ${error.message}`
    );
  }
});


/* =========================================================
   VERIFY OTP
========================================================= */
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const cleanEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: cleanEmail,
  });

  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error(
      'Tài khoản đã được xác thực trước đó'
    );
  }

  /* -----------------------------------------
     CHECK OTP
  ----------------------------------------- */
  if (
    user.verificationCode !== otp ||
    !user.verificationCodeExpires ||
    user.verificationCodeExpires < Date.now()
  ) {
    res.status(400);

    throw new Error(
      'Mã OTP không chính xác hoặc đã hết hạn'
    );
  }

  /* -----------------------------------------
     VERIFY USER
  ----------------------------------------- */
  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;

  await user.save();

  /* -----------------------------------------
     LOGIN AFTER VERIFY
  ----------------------------------------- */
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    role: user.role,
    paypalClientId: user.paypalClientId,
    token: generateToken(user._id),
  });
});


/* =========================================================
   RESEND OTP
========================================================= */
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const cleanEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: cleanEmail,
  });

  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error(
      'Tài khoản đã được xác thực trước đó'
    );
  }

  /* -----------------------------------------
     GENERATE NEW OTP
  ----------------------------------------- */
  const newOtp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  user.verificationCode = newOtp;

  user.verificationCodeExpires =
    Date.now() + 10 * 60 * 1000;

  await user.save();

  /* -----------------------------------------
     SEND NEW EMAIL
  ----------------------------------------- */
  try {

    await sendEmail({
      to: cleanEmail,

      subject:
        'Mã xác thực mới - The Digital Shop',

      html: createOtpEmail({
        name: user.name,
        otp: newOtp,
        resend: true,
      }),
    });

    console.log(
      `[RESEND] MÃ OTP CỦA ${cleanEmail}: ${newOtp}`
    );

    res.json({
      message:
        'Đã gửi lại mã xác thực tới email của bạn',
    });

  } catch (error) {

    console.error(
      'BREVO RESEND EMAIL ERROR:',
      error
    );

    res.status(500);

    throw new Error(
      `Lỗi hệ thống gửi mail: ${error.message}`
    );
  }
});


/* =========================================================
   GET USER PROFILE
========================================================= */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      paypalClientId: user.paypalClientId,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


/* =========================================================
   UPDATE USER PROFILE
========================================================= */
const updateUserProfile = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    paypalClientId,
  } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = name || user.name;
  user.email = email || user.email;

  user.paypalClientId =
    paypalClientId || user.paypalClientId;

  if (password) {
    user.password = password;
  }

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    isAdmin: updatedUser.isAdmin,
    role: updatedUser.role,
    paypalClientId: updatedUser.paypalClientId,
    token: generateToken(updatedUser._id),
  });
});


/* =========================================================
   GET PAYPAL CLIENT ID
========================================================= */
const getPayPalClientId = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404).json({
      message: 'User not found',
    });

    return;
  }

  if (!user.paypalClientId) {
    res.status(404).json({
      message:
        'PayPal Client ID not set for this user',
    });

    return;
  }

  res.json({
    clientId: user.paypalClientId,
  });
});


/* =========================================================
   GET USERS
========================================================= */
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});


/* =========================================================
   DELETE USER
========================================================= */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();

    res.json({
      message: 'User removed',
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


/* =========================================================
   GET USER BY ID
========================================================= */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(
    req.params.id
  ).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


/* =========================================================
   UPDATE USER
========================================================= */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name =
      req.body.name || user.name;

    user.email =
      req.body.email || user.email;

    user.isAdmin =
      req.body.isAdmin;

    const updatedUser =
      await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });

  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


/* =========================================================
   GET PASSWORD
========================================================= */
const getUserPassword = asyncHandler(async (req, res) => {
  const email = req.params.email;

  const user = await User.findOne({
    email,
  });

  if (user) {
    res.json({
      password: user.password,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


/* =========================================================
   GOOGLE LOGIN BYPASS
========================================================= */
const googleLoginBypass = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({
    email,
  });

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      paypalClientId: user.paypalClientId,
      token: generateToken(user._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


/* =========================================================
   EXPORT
========================================================= */
export {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getPayPalClientId,
  updateUser,
  getUserById,
  deleteUser,
  getUsers,
  getUserPassword,
  googleLoginBypass,
  verifyOTP,
  resendOTP,
};
