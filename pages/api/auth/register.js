import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { RateLimiterMemory } from "rate-limiter-flexible";
import axios from "axios";

const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 7200,
});

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (
    password.length < minLength ||
    !hasUppercase ||
    !hasLowercase ||
    !hasNumber ||
    !hasSpecialChar
  ) {
    return false;
  }
  return true;
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username);
};

export default async function handler(req, res) {
  if (!RECAPTCHA_SECRET_KEY) {
    return res.status(500).json({ message: "Server configuration error." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }


  const { username, password, captchaToken } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    await rateLimiter.consume(ip);

    if (!username || !password) {
      return res.status(400).json({ message: "Missing username or password" });
    }

    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.",
      });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({
        message:
          "Username can only contain alphanumeric characters and underscores.",
      });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const captchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
      params: {
        secret: RECAPTCHA_SECRET_KEY,
        response: captchaToken,
      },
    });
    
    if (!captchaResponse.data.success) {
      return res.status(400).json({ message: "CAPTCHA failed." });
    } else if (captchaResponse.data.score < 0.5){
      return res.status(400).json({ message: "CAPTCHA verification failed." });
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    if (error && error.remainingPoints !== undefined && error.msBeforeNext !== undefined) {
      return res.status(429).json({ message: "Too many requests. Try again later." });
    }

    res.status(500).json({ message: "Server error" });
  }
}
