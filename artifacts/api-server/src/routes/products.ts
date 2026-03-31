import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, ilike, or, sql, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const { search, category, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(productsTable.name, `%${search}%`),
        ilike(productsTable.code, `%${search}%`),
        ilike(productsTable.description, `%${search}%`),
      ),
    );
  }
  if (category) {
    conditions.push(ilike(categoriesTable.name, `%${category}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
    .where(whereClause)
    .limit(limitNum)
    .offset(offset)
    .orderBy(productsTable.createdAt);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(whereClause);

  res.json({
    products: products.map((p) => ({
      ...p,
      price: parseFloat(p.price as unknown as string),
      createdAt: p.createdAt.toISOString(),
    })),
    total: count,
    page: pageNum,
    totalPages: Math.ceil(count / limitNum),
  });
});

router.post("/products", async (req, res): Promise<void> => {
  const { name, code, description, categoryId, price, stock, image } = req.body;
  if (!name || !code || !categoryId || price == null || stock == null) {
    res.status(400).json({ message: "Campos requeridos faltantes" });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({ name, code, description, categoryId, price: String(price), stock, image })
    .returning();

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));

  res.status(201).json({
    ...product,
    categoryName: cat?.name,
    price: parseFloat(product.price as unknown as string),
    createdAt: product.createdAt.toISOString(),
  });
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [product] = await db
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
    .where(eq(productsTable.id, id));

  if (!product) {
    res.status(404).json({ message: "Producto no encontrado" });
    return;
  }

  res.json({
    ...product,
    price: parseFloat(product.price as unknown as string),
    createdAt: product.createdAt.toISOString(),
  });
});

router.put("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, code, description, categoryId, price, stock, image } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (code !== undefined) updateData.code = code;
  if (description !== undefined) updateData.description = description;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (price !== undefined) updateData.price = String(price);
  if (stock !== undefined) updateData.stock = stock;
  if (image !== undefined) updateData.image = image;

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, id))
    .returning();

  if (!product) {
    res.status(404).json({ message: "Producto no encontrado" });
    return;
  }

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));

  res.json({
    ...product,
    categoryName: cat?.name,
    price: parseFloat(product.price as unknown as string),
    createdAt: product.createdAt.toISOString(),
  });
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [deleted] = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ message: "Producto no encontrado" });
    return;
  }

  res.json({ success: true, message: "Producto eliminado" });
});

export default router;
