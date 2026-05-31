import { Router } from "express";
import { signToken, verifyLogin } from "../services/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const email = String(req.body.email ?? "").trim();
  const password = String(req.body.password ?? "");

  if (!email || !password) {
    res.status(400).json({ error: "Email y contraseña son obligatorios." });
    return;
  }

  const user = await verifyLogin(email, password);
  if (!user) {
    res.status(401).json({ error: "Credenciales incorrectas." });
    return;
  }

  res.json({
    token: signToken(user),
    user,
  });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
