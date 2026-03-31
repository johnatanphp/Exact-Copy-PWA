import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(
    users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email ?? undefined,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    })),
  );
});

router.post("/users", async (req, res): Promise<void> => {
  const { username, name, email, password, role } = req.body;
  if (!username || !name || !password || !role) {
    res.status(400).json({ message: "Campos requeridos faltantes" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ username, name, email, password: hashed, role })
    .returning();

  res.status(201).json({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email ?? undefined,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
});

router.put("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, email, password, role } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();

  if (!user) {
    res.status(404).json({ message: "Usuario no encontrado" });
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

router.delete("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ message: "Usuario no encontrado" });
    return;
  }

  res.json({ success: true, message: "Usuario eliminado" });
});

export default router;
