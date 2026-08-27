"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

import { validateStoreAccess } from "@/lib/auth";

export async function createCustomer(storeId: string, data: { name: string; phone?: string; address?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) return { success: false, message: "Akses ditolak" };

    const customer = await db.customer.create({
      data: {
        storeId: storeDbId,
        name: data.name,
        phone: data.phone,
        address: data.address,
      },
    });

    revalidatePath(`/${storeId}/customers`);
    revalidatePath(`/${storeId}/pos`);
    return { success: true, data: customer };
  } catch (error) {
    console.error("[createCustomer]", error);
    return { success: false, message: "Internal server error" };
  }
}

export async function payDebt(customerId: string, amount: number, paymentType: "CASH" | "QRIS" | "TRANSFER", notes?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return { success: false, message: "Pelanggan tidak ditemukan" };
    }

    if (amount <= 0 || amount > Number(customer.debtBalance)) {
      return { success: false, message: "Nominal bayar tidak valid" };
    }

    const payment = await db.$transaction(async (tx) => {
      const debtPayment = await tx.debtPayment.create({
        data: {
          customerId,
          amount,
          paymentType,
          notes,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: {
          debtBalance: { decrement: amount },
        },
      });

      return debtPayment;
    });

    revalidatePath(`/${customer.storeId}/customers`);
    return { success: true, data: payment };
  } catch (error) {
    console.error("[payDebt]", error);
    return { success: false, message: "Internal server error" };
  }
}

export async function getUnpaidKasbonOrders(customerId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    const orders = await db.order.findMany({
      where: {
        customerId,
        paymentType: "KASBON",
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        invoiceNo: true,
        totalAmount: true,
        paidAmount: true,
        createdAt: true,
      },
    });

    // Fallback if field comparison doesn't work directly in where:
    // It's better to fetch and filter in JS if not sure, or use prisma raw.
    // Actually Prisma supports field comparison in where? Not easily in standard findMany without raw or specialized syntax in newer Prisma versions.
    // Let's just fetch KASBON and filter where totalAmount > paidAmount in memory since it's a warung app.
    
    const unpaidOrders = orders.filter((o) => Number(o.totalAmount) > Number(o.paidAmount));

    return {
      success: true,
      data: unpaidOrders.map(o => ({
        id: o.id,
        invoiceNo: o.invoiceNo,
        createdAt: o.createdAt,
        totalAmount: Number(o.totalAmount),
        paidAmount: Number(o.paidAmount),
        remainingAmount: Number(o.totalAmount) - Number(o.paidAmount)
      }))
    };
  } catch (error) {
    console.error("[getUnpaidKasbonOrders]", error);
    return { success: false, message: "Internal server error" };
  }
}

export async function payDebtInvoices(
  customerId: string, 
  orderIds: string[], 
  paymentType: "CASH" | "QRIS" | "TRANSFER", 
  notes?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    if (!orderIds.length) return { success: false, message: "Tidak ada invoice yang dipilih" };

    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) return { success: false, message: "Pelanggan tidak ditemukan" };

    const result = await db.$transaction(async (tx) => {
      // 1. Fetch selected orders
      const orders = await tx.order.findMany({
        where: { id: { in: orderIds }, customerId, paymentType: "KASBON" },
      });

      let totalPaid = 0;
      const invoiceNumbers = [];

      for (const order of orders) {
        const remaining = Number(order.totalAmount) - Number(order.paidAmount);
        if (remaining > 0) {
          totalPaid += remaining;
          invoiceNumbers.push(order.invoiceNo || "INV");
          
          await tx.order.update({
            where: { id: order.id },
            data: { paidAmount: order.totalAmount }
          });
        }
      }

      if (totalPaid <= 0) {
        throw new Error("Semua invoice yang dipilih sudah lunas.");
      }

      const paymentNotes = notes || `Pembayaran Kasbon: ${invoiceNumbers.join(", ")}`;

      const debtPayment = await tx.debtPayment.create({
        data: {
          customerId,
          amount: totalPaid,
          paymentType,
          notes: paymentNotes,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: {
          debtBalance: { decrement: totalPaid },
        },
      });

      return {
        id: debtPayment.id,
        customerId: debtPayment.customerId,
        amount: Number(debtPayment.amount),
        paymentType: debtPayment.paymentType,
        notes: debtPayment.notes,
        createdAt: debtPayment.createdAt,
      };
    });

    revalidatePath(`/${customer.storeId}/customers`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[payDebtInvoices]", error);
    return { success: false, message: error.message || "Internal server error" };
  }
}

export async function getCustomersPaginated(storeId: string, page: number = 1, search: string = "", limit: number = 20) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return { success: false, message: "Store access denied" };
    }

    const skip = (page - 1) * limit;

    const where: any = { storeId: storeDbId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, customers] = await db.$transaction([
      db.customer.count({ where }),
      db.customer.findMany({
        where,
        include: {
          debtPayments: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
        orderBy: { name: "asc" },
        take: limit,
        skip,
      })
    ]);

    const parsedCustomers = customers.map(c => ({
      ...c,
      debtBalance: Number(c.debtBalance),
      debtPayments: c.debtPayments.map(p => ({
        ...p,
        amount: Number(p.amount)
      }))
    }));

    const hasMore = skip + customers.length < total;

    return { 
      success: true, 
      data: parsedCustomers,
      meta: {
        total,
        page,
        limit,
        hasMore
      }
    };
  } catch (error: any) {
    console.error("[getCustomersPaginated]", error);
    return { success: false, message: error.message || "Internal server error" };
  }
}
