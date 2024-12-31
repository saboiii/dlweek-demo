import mongoose from "mongoose";

const DataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  projectileCoordinates: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  playerCoordinates: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  minDistance: { type: Number, required: true },
});

export default mongoose.models.Data || mongoose.model("Data", DataSchema);

