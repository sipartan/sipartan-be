const jwt = require("jsonwebtoken");
require("dotenv").config();

const secretKey = process.env.SECRETKEY;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  let token;

  // Check if the Authorization header contains the Bearer token format
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    token = authHeader;  // If there's no "Bearer" prefix, just use the header content
  }

  // Debugging logs (can be removed in production)
  console.log("Authorization Header:", authHeader);
  console.log("Token:", token);

  // Check if the token is missing
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  // Verify the JWT token
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      console.error("Token verification failed:", err);
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    req.user = user; // Attach the decoded user information to the request
    next();
  });
};

module.exports = {
  verifyToken,
};
