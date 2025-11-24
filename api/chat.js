import app, { handler as appHandler } from "../server.js";

// Ensure Vercel calls into the Express app for /api/chat
export default function handler(req, res) {
  return appHandler ? appHandler(req, res) : app(req, res);
}
