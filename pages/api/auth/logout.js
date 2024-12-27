import { setCookie } from "nookies";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  setCookie({ res }, "token", "", {
    httpOnly: true,
    secure: true,
    maxAge: 0,
    sameSite: "strict",
    path: "/",
  });

  return res.status(200).json({ message: "Logged out successfully" });
}
