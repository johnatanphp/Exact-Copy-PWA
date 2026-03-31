import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable, usersTable } from "@workspace/db";
import { eq, sql, lt } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [{ totalProducts }] = await db
    .select({ totalProducts: sql<number>`count(*)::int` })
    .from(productsTable);

  const [{ totalCategories }] = await db
    .select({ totalCategories: sql<number>`count(*)::int` })
    .from(categoriesTable);

  const [{ totalUsers }] = await db
    .select({ totalUsers: sql<number>`count(*)::int` })
    .from(usersTable);

  const [{ lowStockProducts }] = await db
    .select({ lowStockProducts: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(lt(productsTable.stock, 10));

  const [{ totalStockValue }] = await db
    .select({
      totalStockValue: sql<number>`coalesce(sum(${productsTable.price}::numeric * ${productsTable.stock}), 0)::float`,
    })
    .from(productsTable);

  res.json({
    totalProducts,
    totalCategories,
    totalUsers,
    lowStockProducts,
    totalStockValue,
  });
});

router.get("/dashboard/products-by-category", async (_req, res): Promise<void> => {
  const result = await db
    .select({
      categoryName: categoriesTable.name,
      count: sql<number>`count(${productsTable.id})::int`,
    })
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id, categoriesTable.name)
    .orderBy(sql`count(${productsTable.id}) desc`);

  res.json(result);
});

router.get("/dashboard/recent-products", async (_req, res): Promise<void> => {
  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      code: productsTable.code,
      description: productsTable.description,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      price: productsTable.price,
      stock: productsTable.stock,
      image: productsTable.image,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .orderBy(sql`${productsTable.createdAt} desc`)
    .limit(5);

  res.json(
    products.map((p) => ({
      ...p,
      price: parseFloat(p.price as unknown as string),
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

export default router;
