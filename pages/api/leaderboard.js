import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const token = req.cookies.token;

    if (!token) {
      console.log("No token found");
      return res.status(401).json({ message: "Unauthorized" });
    } else {
      try {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        await connectToDatabase();
        const leaderboard = await User.find()
          .select("username highScore -_id")
          .sort({ highScore: -1 })
          .limit(10)
          .lean()

        res.status(200).json(leaderboard);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Error fetching leaderboard" });
      }
    }
  } else if (req.method === "POST") {
    try {
      const token = req.cookies.token;

      if (!token) {
        console.log("No token found");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId, highScore } = req.body;

      if (!userId || highScore == null) {
        return res.status(400).json({ message: "Missing userId or highScore" });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId format" });
      }

      await connectToDatabase();

      await User.findOneAndUpdate(
        { _id: userId },
        { $max: { highScore: highScore } },
        { new: true, upsert: true }
      );

      const leaderboard = await User.find()
        .select("username highScore -_id")
        .sort({ highScore: -1 })
        .limit(10)
        .lean();

      res.status(200).json(leaderboard);
    } catch (error) {
      console.error("Error updating leaderboard:", error);
      res.status(500).json({ message: "Error updating leaderboard" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
