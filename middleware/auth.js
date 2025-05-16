import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT error:", err);
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          success: false,
          message: "Session expired, please log in again.",
        });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

export default authMiddleware;
