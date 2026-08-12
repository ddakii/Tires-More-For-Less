import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib.js";
import { requireAuth, signToken } from "../auth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
  res.json({ token: signToken(payload), user: payload });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json(user);
});
