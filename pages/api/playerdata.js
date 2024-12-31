import { connectToDatabase } from "@/lib/mongodb";
import Data from "@/models/Data";
import mongoose from "mongoose";

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { playerData, userId } = req.body;

        if (!playerData || !userId) {
            return res.status(400).json({ error: 'Missing playerData or userId' });
        }

        try {
            await dbConnect();

            const data = playerData.map(([proj, player, minDist]) => ({
                userId,
                projectileCoordinates: { x: proj[0], y: proj[1] },
                playerCoordinates: { x: player[0], y: player[1] },
                minDistance: minDist,
            }));

            await Data.insertMany(data);

            res.status(200).json({ message: 'Player data saved successfully!' });
        } catch (error) {
            console.error('Error saving player data:', error);
            res.status(500).json({ error: 'Failed to save player data' });
        }

    } else {
        res.status(405).json({ message: "Method Not Allowed" });
    }
}