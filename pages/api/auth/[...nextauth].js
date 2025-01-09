import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { RateLimiterMemory } from "rate-limiter-flexible";
import bcrypt from "bcryptjs"; 
import axios from "axios";

const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 7200,
});

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

export default NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const ip = credentials.ip || "unknown-ip";
        
        try {
          await rateLimiter.consume(ip);
        } catch (error) {
          console.log("Rate limit exceeded for IP:", ip);
          throw new Error("Too many requests. Try again later.");
        }

        const { username, password, captchaToken, isNewUser } = credentials;

        try {
          const captchaResponse = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify`,
            null,
            {
              params: {
                secret: RECAPTCHA_SECRET_KEY,
                response: captchaToken,
              },
            }
          );

          if (!captchaResponse.data.success || captchaResponse.data.score < 0.5) {
            throw new Error("CAPTCHA verification failed.");
          }
        } catch (error) {
          throw new Error("Error verifying CAPTCHA");
        }

        const db = await connectToDatabase();

        if (isNewUser) {
          const existingUser = await User.findOne({ username });
          if (existingUser) {
            throw new Error("User already exists");
          }

          const hashedPassword = await bcrypt.hash(password, 12);

          const newUser = new User({
            username,
            password: hashedPassword,
            highScore: 0,
          });

          await newUser.save();

          return {
            id: newUser._id.toString(),
            username: newUser.username,
            highScore: newUser.highScore,
          };
        }

        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
          throw new Error("Invalid username or password");
        }

        return {
          id: user._id.toString(),
          username: user.username,
          highScore: user.highScore,
        };
      },
    }),
  ],
  session: {
    jwt: true,
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.highScore = user.highScore;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.highScore = token.highScore;
      return session;
    },
  },
});
