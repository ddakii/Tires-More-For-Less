import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function nextNumber(prefix: string, counterId: string, pad = 4) {
  const counter = await prisma.counter.upsert({
    where: { id: counterId },
    create: { id: counterId, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `${prefix}-${String(counter.value).padStart(pad, "0")}`;
}

export function stockStatus(qty: number): "In Stock" | "Low Stock" | "Out of Stock" {
  if (qty <= 0) return "Out of Stock";
  if (qty <= 4) return "Low Stock";
  return "In Stock";
}

export function calcTotals(items: { quantity: number; unitPrice: number }[], discount = 0, taxRate = 0) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = Math.round(afterDiscount * taxRate * 100) / 100;
  const total = Math.round((afterDiscount + tax) * 100) / 100;
  return { subtotal, discount, tax, total, taxRate };
}

export async function createNotification(data: {
  customerId?: string;
  type: string;
  title: string;
  message: string;
  channel?: string;
}) {
  return prisma.notification.create({
    data: {
      customerId: data.customerId,
      type: data.type,
      title: data.title,
      message: data.message,
      channel: data.channel ?? "in-app",
      status: "Mock",
    },
  });
}
