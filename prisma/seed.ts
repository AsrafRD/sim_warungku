import { db as prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding database...');

  // 1. Create a User (Owner)
  const user = await prisma.user.upsert({
    where: { email: 'owner@warung.com' },
    update: {},
    create: {
      email: 'owner@warung.com',
      name: 'Owner Warung',
      password: 'Testdev123', // In a real app, hash this!
      role: 'OWNER',
    },
  });
  console.log('User created:', user.email);

  // 2. Create a Store for the User
  const store = await prisma.store.upsert({
    where: { slug: 'warung-berkah' },
    update: {},
    create: {
      name: 'Warung Berkah',
      slug: 'warung-berkah',
      ownerId: user.id,
      address: 'Jl. Merdeka No. 1',
    },
  });
  console.log('Store created:', store.name);

  // 3. Create a Supplier
  let supplier = await prisma.supplier.findFirst({
    where: { storeId: store.id },
  });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: 'Grosir Maju Jaya',
        contactName: 'Pak Budi',
        phone: '08123456789',
        storeId: store.id,
      },
    });
  }
  console.log('Supplier created:', supplier.name);

  // 4. Create some Products
  const products = [
    {
      name: 'Indomie Goreng',
      sku: 'IND-GOR-01',
      barcode: '8968604321',
      buyPrice: 2500,
      sellPrice: 3000,
      currentStock: 100,
      minStockWarning: 20,
    },
    {
      name: 'Kopi Kapal Api',
      sku: 'KOP-KAP-01',
      barcode: '8968601234',
      buyPrice: 1200,
      sellPrice: 1500,
      currentStock: 50,
      minStockWarning: 10,
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { sku: p.sku, storeId: store.id },
    });
    if (!existing) {
      const created = await prisma.product.create({
        data: {
          ...p,
          storeId: store.id,
          supplierId: supplier.id,
        },
      });
      
      // Initial stock log
      await prisma.stockLog.create({
        data: {
          storeId: store.id,
          productId: created.id,
          type: 'IN',
          quantity: p.currentStock,
          stockBefore: 0,
          stockAfter: p.currentStock,
          notes: 'Seeding stok awal',
        },
      });
      console.log('Product created:', created.name);
    } else {
      console.log('Product already exists:', existing.name);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
