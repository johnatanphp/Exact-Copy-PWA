import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId: number;
    username: string;
    name: string;
    role: string;
  }
}

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: "Usuario y contraseña son requeridos" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

  if (!user) {
    res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    return;
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.name = user.name;
  req.session.role = user.role;

  res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email ?? undefined,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
    message: "Sesión iniciada correctamente",
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Sesión cerrada" });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) {
    res.status(401).json({ message: "Usuario no encontrado" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email ?? undefined,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
