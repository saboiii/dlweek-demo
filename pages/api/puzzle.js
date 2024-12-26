export default function handler(req, res) {
    if (req.method === "POST") {
      const { clicks } = req.body;

      const correctSequence = [0, 3, 1, 2];
      const isValid = correctSequence.every((value, idx) => value === clicks[idx]);
  
      if (isValid) {
        return res.status(200).json({ isValid: true });
      } else {
        return res.status(200).json({ isValid: false });
      }
    } else {
      return res.status(405).json({ message: "Method Not Allowed" });
    }
  }
  