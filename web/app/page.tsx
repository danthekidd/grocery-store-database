import { prisma } from "@/lib/prisma";
import { ShopDemo } from "@/app/components/shop-demo";

export default async function Home() {
  const categories = await prisma.categories.findMany({
    orderBy: { category_name: "asc" },
  });

  const products = await prisma.products.findMany({
    orderBy: { product_name: "asc" },
    take: 24,
    include: {
      categories: true,
      suppliers: true,
    },
  });

  const shopProducts = products.map((product) => ({
    id: product.product_id,
    sku: product.sku,
    name: product.product_name,
    category: product.categories?.category_name ?? null,
    supplier: product.suppliers?.supplier_name ?? null,
    price: product.price,
    stock: product.stock_quantity,
  }));

  const categoryOptions = categories.map((category) => ({
    id: category.category_id,
    name: category.category_name,
  }));

  return <ShopDemo products={shopProducts} categories={categoryOptions} />;
}
