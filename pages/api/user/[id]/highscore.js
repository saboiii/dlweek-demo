import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  const { id: userId } = req.query;
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  } else {
    if (req.method === 'GET') {
      try {
        if (session.user.id !== userId) {
          return res.status(403).json({ message: 'Unauthorized user.' });
        }

        if (!userId) {
          return res.status(400).json({ message: 'User ID is required' });
        }

        await connectToDatabase();
        const user = await User.findOne({ _id: userId });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ highScore: user.highScore || 0 });
      } catch (error) {
        console.error('Error fetching high score:', error);
        return res.status(500).json({ message: 'Error fetching high score' });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  }
}
