import jwt from "jsonwebtoken";

// Use the same secret as in serverless.yml
const JWT_SECRET = process.env.JWT_SECRET || "mysecret";

// Example payload (can be dynamic)
const payload = {
  userId: "user123", // You can change per test user
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

console.log("Generated JWT Token:\n");
console.log(token);
