import { Router, type IRouter } from "express";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      description: categoriesTable.description,
      productCount: sql<number>`count(${productsTable.id})::int`,
      createdAt: categoriesTable.createdAt,
    })
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.name);

  res.json(
    categories.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  );
});

router.post("/categories", async (req, res): Promise<void> => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ message: "El nombre es requerido" });
    return;
  }

  const [category] = await db.insert(categoriesTable).values({ name, description }).returning();
  res.status(201).json({
    ...category,
    productCount: 0,
    createdAt: category.createdAt.toISOString(),
  });
});

export default router;
