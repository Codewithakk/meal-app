import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import httpResponse from "../../utils/httpResponse";
import httpError from "../../utils/httpError";
import User from "../../models/user.model";
import sendEmail from "../../utils/sendEmail";
import redisClient from "../../cache/redisClient";
import { generateToken, generateTokenByShortTime } from "../../utils/generateToken";
import jwt from 'jsonwebtoken';
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default {
  // **User Signup Function**
  // signup: async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const { userName, userEmail, password } = req.body;
  //     const userProfile = req.file ? req.file.path : null; // Get uploaded profile image URL
  //     if (!validateFields({ userName, userEmail, password })) {
  //       return httpResponse(req, res, 400, "All fields are required except userProfile");
  //     }

  //     const existingUser = await User.findOne({ userEmail });
  //     if (existingUser) {
  //       return httpResponse(req, res, 400, "User already exists");
  //     }

  //     const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

  //     const newUser = new User({ userName, userEmail, password: hashedPassword }, userProfile);
  //     await newUser.save();

  //     const token = generateToken(newUser._id as string);
  //     httpResponse(req, res, 201, "User registered successfully", { token, user: newUser });
  //   } catch (err) {
  //     httpError(next, err, req, 500);
  //   }
  // },

  signup: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { firstName, lastName, userName, userEmail, password } = req.body;
      // const userProfile = req.file ? req.file.path : null;

      const existingUser = await User.findOne({ userEmail });
      if (existingUser) {
        return httpResponse(req, res, 400, "Email already exists");
      }

      const existingUsername = await User.findOne({ userName });
      if (existingUsername) {
        return httpResponse(req, res, 400, "Username already exists");
      }

      const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
      const newUser = new User({ firstName, lastName, userName, userEmail, password: hashedPassword });
      await newUser.save();

      // Remove password field from user object
      const userData = newUser.toObject() as { password?: string;[key: string]: any };
      delete userData.password;

      // Generate tokens
      const { token, refreshToken } = generateToken(newUser._id as string);

      // Store refresh token in Redis
      await redisClient.setEx(`refresh:${newUser._id}`, 604800, token);

      httpResponse(req, res, 201, "User registered successfully", { token, refreshToken, user: userData });
    } catch (err) {
      httpError(next, err, req, 500);
    }
  },

  // **User Sign-In Function**
  // signin: async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const { userEmail, password } = req.body;

  //     if (!validateFields({ userEmail, password })) {
  //       return httpResponse(req, res, 400, "Email and password are required");
  //     }

  //     const user = await User.findOne({ userEmail });
  //     if (!user || !(await bcrypt.compare(password, user.password))) {
  //       return httpResponse(req, res, 400, "Invalid credentials");
  //     }

  //     const token = generateToken(user._id as string);
  //     // 🔹 Store the token in Redis (auto expires in 1 hour)
  //     await redisClient.set(`auth:${user._id}`, token, { EX: 3600 });
  //     httpResponse(req, res, 200, "Login successful", { token, user });
  //   } catch (err) {
  //     httpError(next, err, req, 500);
  //   }
  // },

  // signin: async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const { userEmail, password } = req.body;

  //     if (!validateFields({ userEmail, password })) {
  //       return httpResponse(req, res, 400, "Email and password are required");
  //     }

  //     const user = await User.findOne({ userEmail }).select("userName userEmail password").lean();
  //     if (!user || !(await bcrypt.compare(password, user.password))) {
  //       return httpResponse(req, res, 400, "Invalid credentials");
  //     }

  //     const token = generateToken(user._id as string);

  //     // 🔹 Store the token in Redis (expires in 1 day)
  //     // await redisClient.set(`auth:${user._id}`, token, { EX: 86400 });
  //     await redisClient.setEx(`auth:${user._id}`, 86400, token);  
  //     httpResponse(req, res, 200, "Login successful", { token, user });
  //   } catch (err) {
  //     httpError(next, err, req, 500);
  //   }
  // },
  signin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail, password } = req.body;

      if (!userEmail || !password) {
        return httpResponse(req, res, 400, "Email and password are required");
      }

      const user = await User.findOne({ userEmail, password: { $ne: null } }).populate("dietTypes", "_id name img");
      if (!user || !(await bcrypt.compare(password, user?.password!))) {
        return httpResponse(req, res, 400, "Invalid credentials");
      }

      // Remove password field from user object
      const userWithoutPassword = user.toObject() as { password?: string;[key: string]: any };
      delete userWithoutPassword.password;

      // Generate new tokens
      const { token, refreshToken } = generateToken(user._id as string);

      //Store access token in Redis (expires in 7 days)
      await redisClient.setEx(`auth:${user._id}`, 604800, token);

      // Store refresh token in Redis (expires in 7 days)
      await redisClient.setEx(`refresh:${user._id}`, 604800, refreshToken);

      return httpResponse(req, res, 200, "Login successful", { token, refreshToken, user: userWithoutPassword });
    } catch (err) {
      httpError(next, err, req, 500);
    }
  },

  googleLogin: async (req: Request, res: Response, next: NextFunction) => {
    const { idToken } = req.body;
    const clientAndroid = process.env.GOOGLE_CLIENT_ID_ANDROID
    const clientIos = process.env.GOOGLE_CLIENT_ID_IOS

    try {
      if (!clientAndroid || !clientIos) {
        return httpResponse(req, res, 404, "Google login failed. Client Ids don't exist.");
      }

      const clientList: string[] = [
        clientAndroid,
        clientIos
      ];

      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientList,
        maxExpiry: 3600 // Allow up to 1 hour (3600 seconds) of skew
      });

      const payload = ticket.getPayload();
      if (!payload) return httpResponse(req, res, 401, "Invalid Google token");

      const { sub, email, picture, name, given_name, family_name } = payload;

      let user = await User.findOne({ googleId: sub });
      if (!user) {
        // Try to match by email if user exists but wasn't linked with Google yet
        user = await User.findOne({ userEmail: email });

        if (user) {
          user.googleId = sub;
          await user.save();
        } else {

          const userName = name ? createUsername(name) : ''
          // New user via Google
          user = await User.create({
            firstName: given_name,
            lastName: family_name,
            userName: userName,
            userEmail: email,
            userProfile: picture,
            googleId: sub,
            verified: true,
            onboardingCompleted: false,
          });
        }
      }

      // Remove password field from user object
      const userWithoutPassword = user.toObject() as { password?: string;[key: string]: any };
      delete userWithoutPassword.password;

      // Generate new tokens
      const { token } = generateToken(user._id as string);

      //Store access token in Redis (expires in 7 days)
      await redisClient.setEx(`auth:${user._id}`, 604800, token);

      return httpResponse(req, res, 200, "Login successful", { token, user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Google login failed" });
    }
  },

  refreshToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return httpResponse(req, res, 401, "Unauthorized");

      // Ensure JWT secrets are defined
      const JWT_SECRET = process.env.JWT_SECRET!;
      const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
      if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
        throw new Error("JWT_SECRET or JWT_REFRESH_SECRET is not defined in environment variables.");
      }

      // Verify the refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as jwt.JwtPayload;
      const userId = decoded.userId;

      // Check if refresh token exists in Redis
      const storedRefreshToken = await redisClient.get(`refresh:${userId}`);
      if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
        return httpResponse(req, res, 403, "Invalid refresh token");
      }

      // Generate new access & refresh tokens
      const { token, refreshToken: newRefreshToken } = generateToken(userId);

      // Store new tokens in Redis
      await redisClient.setEx(`refresh:${userId}`, 604800, newRefreshToken); // 7 days expiry
      await redisClient.setEx(`auth:${userId}`, 604800, token); // 1 hour expiry

      return httpResponse(req, res, 200, "Token refreshed", { token, refreshToken: newRefreshToken });
    } catch (error) {
      return httpResponse(req, res, 403, "Invalid or expired refresh token");
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return httpResponse(req, res, 401, "Unauthorized");
      }

      // 🔹 Remove refresh token from Redis
      await redisClient.del(`auth:${userId}`);
      await redisClient.del(`refresh:${userId}`);

      return httpResponse(req, res, 200, "Logout successful");
    } catch (err) {
      httpError(next, err, req, 500);
    }
  },

  // **Forgot Password Function (Sends OTP)**
  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isDevelopment = process.env.NODE_ENV === "development";
      const serverUrl = isDevelopment ? process.env.LOCAL_HOST : process.env.SERVER_URL;

      const { userEmail } = req.body;

      const user = await User.findOne({ userEmail }).select("userName userEmail");
      if (!user) return httpResponse(req, res, 400, "User not found");

      const { token } = generateTokenByShortTime(user._id as string, 30 * 60); // 30 minutes

      await redisClient.setEx(`auth:${user._id}`, 1800, token); // 30 minutes expiry

      const resetLink = `${serverUrl}/api/v1/auth/open-app/?token=${token}`

      // Email Template
      const emailTemplate = `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; text-align: center;">
            <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <h2 style="color: #3498db; margin-bottom: 20px;">🔒 Set a New Password</h2>

              <p style="font-size: 16px;">Hi <strong>${user.userName}</strong>,</p>
              <p style="font-size: 16px;">We received a request to change your password. Click the button below to set a new one:</p>

              <!-- Styled link that looks like a button -->
              <a href="${resetLink}" style="display: inline-block; background-color: #3498db; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 5px; margin-top: 20px; font-weight: bold; font-size: 16px; cursor: pointer;">
                Set New Password
              </a>

              <p style="font-size: 14px; color: #555; margin-top: 25px;">This link will expire in <strong>30 minutes</strong>.</p>
              <p style="font-size: 14px; color: #555;">If you did not request this change, you can safely ignore this email.</p>
              
              <br>
              <p style="font-size: 14px; color: #777;">Thanks,<br><strong>The Mood Meal Team</strong></p>
            </div>
          </body>
        </html>
        `;

      await sendEmail(userEmail, "Reset Your Password", emailTemplate);

      return httpResponse(req, res, 200, "Password reset link sent to your email");
    } catch (err) {
      httpError(next, err, req, 500);
    }
  },

  openApp: async (req: Request, res: Response, next: NextFunction) => {
    const dipLink = process.env.DIPLINK;
    const token = req.query.token as string;

    // Example deep link
    const resetLink = `${dipLink}?token=${token}`;
    res.redirect(resetLink);
  },

  // **User Logout Function**
  // logout: async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const userId = req.user?.userId;

  //     if (!userId) {
  //       return httpResponse(req, res, 401, "Unauthorized");
  //     }

  //     // 🔹 Remove token from Redis
  //     await redisClient.del(`auth:${userId}`);

  //     return httpResponse(req, res, 200, "Logout successful");
  //   } catch (err) {
  //     httpError(next, err, req, 500);
  //   }
  // },

  // **Verify OTP Function (No Storage)**
  verifyOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { otp } = req.body;
      if (!otp) return httpResponse(req, res, 400, "OTP is required");

      // Retrieve email associated with OTP from Redis
      const userEmail = await redisClient.get(`otp:${otp}`);
      if (!userEmail) return httpResponse(req, res, 400, "OTP expired or invalid");

      // Fetch user from DB
      const user = await User.findOne({ userEmail });
      if (!user) return httpResponse(req, res, 400, "User not found");

      // 🔹 Store the user's email in Redis for password reset (valid for 5 minutes)
      await redisClient.set(`reset:${userEmail}`, userEmail, { EX: 300 });

      // Delete OTP from Redis after verification
      await redisClient.del(`otp:${otp}`);

      return httpResponse(req, res, 200, "OTP verified successfully", { userEmail });
    } catch (err) {
      httpError(next, err, req, 500);
    }
  },

  // **Reset Password Function (After OTP Verification)**
  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const { newPassword } = req.body;
      if (!newPassword) return httpResponse(req, res, 400, "New password is required");

      const user = await User.findById(userId);
      if (!user) return httpResponse(req, res, 400, "User not found");

      if (!user || (await bcrypt.compare(newPassword, user?.password!))) {
        return httpResponse(req, res, 400, "New password must differ from the old one.");
      }
      // Hash new password and update
      user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
      await user.save();

      return httpResponse(req, res, 200, "Your password has been changed successfully");
    } catch (err) {
      httpError(next, err, req, 500);
    }
  },
};

export const createUsername = (name: string) => {
  const baseName = name.toLowerCase().replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/[^a-z0-9_]/gi, '').slice(0, 20);

  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
  let userName = `${baseName}_${randomSuffix}`;

  // Trim and limit to 30 characters
  userName = userName.trim().slice(0, 30);
  return userName;
};

export const getPrivacyPolicy = (_req: Request, res: Response) => {
  res.json({ content: "Privacy Policy: We respect your privacy..." });
};

export const getAboutUs = (_req: Request, res: Response) => {
  res.json({ content: "About Us: We are a leading platform..." });
};

export const getHelp = (_req: Request, res: Response) => {
  res.json({ content: "Help Center: How can we assist you?" });
};