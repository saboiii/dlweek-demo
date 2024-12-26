import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { setCookie } from "nookies";
import { connectToDatabase } from "@/lib/mongodb";
import { RateLimiterMemory } from "rate-limiter-flexible";
import axios from "axios";

const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 300,
});

const SECRET = process.env.JWT_SECRET;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

export default async function handler(req, res) {
  if (!SECRET || !RECAPTCHA_SECRET_KEY) {
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

    await connectToDatabase();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const captchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
      params: {
        secret: RECAPTCHA_SECRET_KEY,
        response: captchaToken,
      },
    });
    
    if (!captchaResponse.data.success || captchaResponse.data.score < 0.5) {
      return res.status(400).json({ message: "CAPTCHA verification failed." });
    }

    const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: "7d" });

    setCookie({ res }, "token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "strict",
      path: "/",
    });
    
    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    if (error && error.remainingPoints !== undefined && error.msBeforeNext !== undefined) {
      console.log("Rate limit exceeded for IP:", ip);
      return res.status(429).json({ message: "Too many requests. Try again later." });
    }

    console.error("Error during login:", error);
    return res.status(500).json({ message: "Server error during login. Please try again." });
  }
}
