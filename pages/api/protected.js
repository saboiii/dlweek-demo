import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";

const SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  const { id: userId } = req.query;
  
  if (req.method === "GET") {
    const token = req.cookies.token;

    if (!token) {
      console.log("No token found");
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      await connectToDatabase();
      const decoded = jwt.verify(token, SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        console.log("User not found");
        return res.status(401).json({ message: "User not found" });
      }

      res.status(200).json({ user });
    } catch (err) {
      console.log("Token verification failed:", err);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
