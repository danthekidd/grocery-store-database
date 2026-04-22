import { prisma } from "@/lib/prisma";
import { ShopDemo } from "@/app/components/shop-demo";

export default async function Home() {
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

  return <ShopDemo products={shopProducts} />;
}
