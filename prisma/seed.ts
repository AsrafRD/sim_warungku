import bcrypt from 'bcryptjs';
import { db as prisma } from '../src/lib/prisma';

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

let invoiceCounter = 1000;

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // --- WIPE EXISTING DATA ---
  console.log('🧹 Wiping existing data...');
  await prisma.debtPayment.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.supplierTokenTransaction.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  // --- CORE ENTITIES ---
  console.log('👤 Creating Owner & Store...');
  const hashedPassword = await bcrypt.hash('Testdev123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'owner@warung.com',
      name: 'Bapak Haji',
      password: hashedPassword,
      role: 'OWNER',
    },
  });

  const store = await prisma.store.create({
    data: {
      name: 'Warung Berkah (Pusat)',
      slug: 'warung-berkah',
      ownerId: user.id,
      address: 'Jl. Merdeka No. 45, Bandung',
      phone: '081234567890',
    },
  });

  // Buat langganan aktif untuk warung-berkah (Paket Mobile Pro Utama)
  await prisma.subscription.create({
    data: {
      storeId: store.id,
      plan: 'MOBILE_MONTHLY',
      status: 'ACTIVE',
      hasWebAccess: false,
      amount: 49000,
      currentPeriodStart: new Date(),
      currentPeriodEnd: addDays(new Date(), 30),
    },
  });

  console.log('📦 Creating Categories, Units, & Suppliers...');
  const catSembako = await prisma.category.create({ data: { name: 'Sembako', storeId: store.id } });
  const catMinuman = await prisma.category.create({ data: { name: 'Minuman', storeId: store.id } });
  const catSnack = await prisma.category.create({ data: { name: 'Snack & Jajanan', storeId: store.id } });
  const catRokok = await prisma.category.create({ data: { name: 'Rokok', storeId: store.id } });

  const unitPcs = await prisma.unit.create({ data: { name: 'Pcs', storeId: store.id } });
  const unitKg = await prisma.unit.create({ data: { name: 'Kg', storeId: store.id } });
  const unitBungkus = await prisma.unit.create({ data: { name: 'Bungkus', storeId: store.id } });

  const supGrosir = await prisma.supplier.create({
    data: { name: 'Grosir Maju Jaya', contactName: 'Ko Ahong', phone: '08111222333', storeId: store.id }
  });
  const supDistributor = await prisma.supplier.create({
    data: { name: 'Distributor Resmi Indofood', contactName: 'Mbak Sari', phone: '08222333444', storeId: store.id }
  });

  console.log('🛒 Creating Products...');
  const productTemplates = [
    { name: 'Beras Premium', sku: 'SEM-BRS-01', cat: catSembako, unit: unitKg, sup: supGrosir, buy: 12000, sell: 14500, stock: 50 },
    { name: 'Gula Pasir Gulaku', sku: 'SEM-GLA-01', cat: catSembako, unit: unitKg, sup: supGrosir, buy: 14000, sell: 16000, stock: 30 },
    { name: 'Minyak Goreng Bimoli 2L', sku: 'SEM-MYK-02', cat: catSembako, unit: unitPcs, sup: supGrosir, buy: 34000, sell: 37500, stock: 20 },
    { name: 'Indomie Goreng Spesial', sku: 'SEM-IND-01', cat: catSembako, unit: unitPcs, sup: supDistributor, buy: 2700, sell: 3500, stock: 200 },
    { name: 'Teh Pucuk Harum 350ml', sku: 'MIN-TPH-01', cat: catMinuman, unit: unitPcs, sup: supDistributor, buy: 3000, sell: 4000, stock: 150 },
    { name: 'Kopi Kenangan Mantan', sku: 'MIN-KKM-01', cat: catMinuman, unit: unitPcs, sup: supDistributor, buy: 7000, sell: 9500, stock: 40 },
    { name: 'Chitato Sapi Panggang', sku: 'SNK-CHT-01', cat: catSnack, unit: unitPcs, sup: supDistributor, buy: 8500, sell: 11000, stock: 60 },
    { name: 'Gudang Garam Filter', sku: 'ROK-GGF-01', cat: catRokok, unit: unitBungkus, sup: supGrosir, buy: 22000, sell: 24500, stock: 100 },
    { name: 'Sampoerna Mild', sku: 'ROK-SMM-01', cat: catRokok, unit: unitBungkus, sup: supGrosir, buy: 28000, sell: 31000, stock: 80 },
    { name: 'Aqua Botol 600ml', sku: 'MIN-AQA-600', cat: catMinuman, unit: unitPcs, sup: supGrosir, buy: 2000, sell: 3000, stock: 120 },
  ];

  const dbProducts = [];
  for (const pt of productTemplates) {
    const p = await prisma.product.create({
      data: {
        storeId: store.id,
        supplierId: pt.sup.id,
        categoryId: pt.cat.id,
        unitId: pt.unit.id,
        name: pt.name,
        sku: pt.sku,
        barcode: `899${randomInt(1000000, 9999999)}`,
        buyPrice: pt.buy,
        sellPrice: pt.sell,
        currentStock: pt.stock,
        minStockWarning: 10,
      }
    });
    dbProducts.push(p);

    await prisma.stockLog.create({
      data: {
        storeId: store.id,
        productId: p.id,
        type: 'IN',
        quantity: pt.stock,
        stockBefore: 0,
        stockAfter: pt.stock,
        notes: 'Initial Stock (Seed)',
      }
    });
  }

  console.log('👥 Creating Customers...');
  const customers = [];
  const customerNames = ['Budi (Tukang Ojek)', 'Ibu Ani', 'Pak RT', 'Mas Anton (Bengkel)', 'Bu Siti (Warung Sebelah)'];
  for (const name of customerNames) {
    const c = await prisma.customer.create({
      data: {
        storeId: store.id,
        name: name,
        phone: `08${randomInt(100000000, 999999999)}`,
        debtBalance: 0,
      }
    });
    customers.push(c);
  }

  // --- HISTORICAL TRANSACTIONS (30 DAYS) ---
  console.log('📅 Simulating 30 days of transactions...');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  startDate.setHours(7, 0, 0, 0); // Open at 7 AM

  for (let day = 0; day <= 30; day++) {
    const currentDate = addDays(startDate, day);
    
    // 1. Open Shift at 07:00
    const shiftOpenDate = new Date(currentDate);
    shiftOpenDate.setHours(7, 0, 0, 0);
    
    const openingBalance = randomInt(50, 100) * 1000; // 50k - 100k
    
    const shift = await prisma.shift.create({
      data: {
        storeId: store.id,
        cashierId: user.id,
        openingBalance,
        status: 'OPEN',
        openedAt: shiftOpenDate,
      }
    });

    // 2. Create 5-15 Orders per day
    const numOrders = randomInt(5, 15);
    let shiftCashTotal = 0;
    
    for (let o = 0; o < numOrders; o++) {
      // Random time between 07:30 and 21:00
      const orderDate = new Date(currentDate);
      orderDate.setHours(randomInt(7, 20), randomInt(0, 59), 0, 0);

      // Random payment method (Mostly CASH, some QRIS, rare KASBON)
      const randPay = Math.random();
      let payType: 'CASH' | 'QRIS' | 'TRANSFER' | 'KASBON' = 'CASH';
      let selectedCustomer = null;

      if (randPay > 0.8) payType = 'QRIS';
      else if (randPay > 0.7) {
        payType = 'KASBON';
        selectedCustomer = customers[randomInt(0, customers.length - 1)];
      }

      // Pick 1-4 items for the order
      const numItems = randomInt(1, 4);
      let totalAmount = 0;
      const orderItemsData = [];

      for (let i = 0; i < numItems; i++) {
        const product = dbProducts[randomInt(0, dbProducts.length - 1)];
        const qty = randomInt(1, 3);
        const subtotal = Number(product.sellPrice) * qty;
        totalAmount += subtotal;

        orderItemsData.push({
          productId: product.id,
          quantity: qty,
          buyPrice: product.buyPrice,
          sellPrice: product.sellPrice,
          subtotal: subtotal,
        });

        // Skip decrementing stock here to keep it simple, or we can just let currentStock represent "current" 
        // regardless of history. Since we want realistic current stock, we won't mutate stock dynamically in loop
        // to avoid running out of stock during seeding.
      }

      // Create Order
      const datePrefix = `${orderDate.getFullYear()}${(orderDate.getMonth() + 1).toString().padStart(2, '0')}${orderDate.getDate().toString().padStart(2, '0')}`;
      const invoiceNo = `INV-${datePrefix}-${invoiceCounter++}`;
      
      await prisma.order.create({
        data: {
          storeId: store.id,
          shiftId: shift.id,
          invoiceNo,
          customerId: selectedCustomer?.id,
          paymentType: payType,
          totalAmount,
          paidAmount: payType === 'KASBON' ? 0 : totalAmount,
          changeAmount: 0,
          createdAt: orderDate,
          notes: payType === 'KASBON' ? 'Biasa, ambil dulu' : null,
          items: {
            create: orderItemsData
          }
        }
      });

      if (payType === 'CASH') {
        shiftCashTotal += totalAmount;
      } else if (payType === 'KASBON' && selectedCustomer) {
        // Increase debt
        await prisma.customer.update({
          where: { id: selectedCustomer.id },
          data: { debtBalance: { increment: totalAmount } }
        });
      }
    }

    // 3. Occasionally pay debt
    if (day % 7 === 0) { // Every 7 days
      const debtors = await prisma.customer.findMany({ where: { storeId: store.id, debtBalance: { gt: 0 } } });
      for (const debtor of debtors) {
        if (Math.random() > 0.5) { // 50% chance to pay half debt
          const payAmt = Math.floor(Number(debtor.debtBalance) / 2);
          const payDate = new Date(currentDate);
          payDate.setHours(15, 0, 0, 0);

          await prisma.debtPayment.create({
            data: {
              customerId: debtor.id,
              amount: payAmt,
              paymentType: 'CASH',
              notes: 'Bayar cicilan mingguan',
              createdAt: payDate,
            }
          });
          
          await prisma.customer.update({
            where: { id: debtor.id },
            data: { debtBalance: { decrement: payAmt } }
          });
          
          shiftCashTotal += payAmt;
        }
      }
    }

    // 4. Close Shift at 21:00 (if it's not today, or if today is already past 21:00)
    const now = new Date();
    const isToday = currentDate.toDateString() === now.toDateString();
    
    if (!isToday) {
      const shiftCloseDate = new Date(currentDate);
      shiftCloseDate.setHours(21, 0, 0, 0);
      
      const expectedBalance = openingBalance + shiftCashTotal;
      // Add slight discrepancy randomly
      const closingBalance = Math.random() > 0.9 ? expectedBalance - randomInt(1, 5) * 1000 : expectedBalance;

      await prisma.shift.update({
        where: { id: shift.id },
        data: {
          status: 'CLOSED',
          expectedBalance,
          closingBalance,
          closedAt: shiftCloseDate,
          notes: closingBalance < expectedBalance ? 'Ada selisih kas' : null,
        }
      });
    }
  }

  console.log('✅ Seeding completely finished! Enjoy your 30 days of synthetic data.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
