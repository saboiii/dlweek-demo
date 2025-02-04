import { connectToDatabase } from "@/lib/mongodb";
import Data from "@/models/Data";

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { playerData, userId } = req.body;

        if (!playerData || !userId) {
            return res.status(400).json({ error: 'Missing playerData or userId' });
        }

        try {
            await connectToDatabase();

            const data = Object.values(playerData).map((entry) => ({
                userId,
                projectileCoordinates: {
                    x: parseFloat(entry.projectileCoords.x),
                    y: parseFloat(entry.projectileCoords.y),
                },
                playerCoordinates: {
                    x: parseFloat(entry.playerCoords.x),
                    y: parseFloat(entry.playerCoords.y),
                },
                minDistance: entry.minDistance,
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
