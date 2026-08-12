import { Router } from "express";
import { prisma, nextNumber, calcTotals, createNotification, stockStatus } from "../lib.js";
import { requireAuth } from "../auth.js";

export const workflowRouter = Router();
workflowRouter.use(requireAuth);

async function getTaxRate() {
  const s = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  return s?.taxRate ?? 0.07875;
}

// ---------- Appointments ----------
workflowRouter.get("/appointments", async (req, res) => {
  const { date, from, to, status } = req.query;
  const where: Record<string, unknown> = {};
  if (date) where.date = String(date);
  if (from || to) where.date = { ...(from ? { gte: String(from) } : {}), ...(to ? { lte: String(to) } : {}) };
  if (status) where.status = String(status);
  const appointments = await prisma.appointment.findMany({
    where,
    include: { customer: true, vehicle: true, serviceOrder: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  res.json(appointments);
});

workflowRouter.get("/appointments/:id", async (req, res) => {
  const a = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: { customer: true, vehicle: true, serviceOrder: true },
  });
  if (!a) return res.status(404).json({ error: "Not found" });
  res.json(a);
});

workflowRouter.post("/appointments", async (req, res) => {
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const number = await nextNumber(settings?.appointmentPrefix ?? "APT", "appointment");
  const a = await prisma.appointment.create({
    data: {
      number,
      customerId: req.body.customerId,
      vehicleId: req.body.vehicleId || null,
      serviceType: req.body.serviceType,
      date: req.body.date,
      time: req.body.time,
      status: req.body.status || "Confirmed",
      notes: req.body.notes || null,
      tireSize: req.body.tireSize || null,
    },
    include: { customer: true, vehicle: true },
  });
  res.status(201).json(a);
});

workflowRouter.patch("/appointments/:id", async (req, res) => {
  const a = await prisma.appointment.update({
    where: { id: req.params.id },
    data: req.body,
    include: { customer: true, vehicle: true, serviceOrder: true },
  });
  if (req.body.status === "Confirmed") {
    await createNotification({
      customerId: a.customerId,
      type: "Appointment Confirmed",
      title: "Appointment confirmed",
      message: `${a.number} confirmed for ${a.date} at ${a.time}.`,
    });
  }
  res.json(a);
});

workflowRouter.post("/appointments/:id/check-in", async (req, res) => {
  const a = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: "Checked In" },
    include: { customer: true, vehicle: true },
  });
  res.json(a);
});

workflowRouter.post("/appointments/:id/create-service-order", async (req, res) => {
  const a = await prisma.appointment.findUnique({ where: { id: req.params.id }, include: { serviceOrder: true } });
  if (!a) return res.status(404).json({ error: "Not found" });
  if (a.serviceOrder) return res.status(400).json({ error: "Service order already exists" });

  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const number = await nextNumber(settings?.servicePrefix ?? "SO", "serviceOrder");
  const taxRate = settings?.taxRate ?? 0.07875;

  const so = await prisma.serviceOrder.create({
    data: {
      number,
      customerId: a.customerId,
      vehicleId: a.vehicleId,
      appointmentId: a.id,
      complaint: a.notes,
      status: "Open",
      taxRate,
    },
    include: { customer: true, vehicle: true, items: true, appointment: true },
  });

  await prisma.appointment.update({ where: { id: a.id }, data: { status: "In Service" } });
  res.status(201).json(so);
});

// ---------- Quote Requests ----------
workflowRouter.get("/quote-requests", async (_req, res) => {
  const list = await prisma.quoteRequest.findMany({
    include: { customer: true, vehicle: true, quote: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(list);
});

workflowRouter.patch("/quote-requests/:id", async (req, res) => {
  const qr = await prisma.quoteRequest.update({ where: { id: req.params.id }, data: req.body });
  res.json(qr);
});

workflowRouter.post("/quote-requests/:id/create-quote", async (req, res) => {
  const qr = await prisma.quoteRequest.findUnique({ where: { id: req.params.id } });
  if (!qr) return res.status(404).json({ error: "Not found" });
  if (!qr.customerId) return res.status(400).json({ error: "Quote request has no customer" });

  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const number = await nextNumber(settings?.quotePrefix ?? "QTE", "quote");
  const taxRate = settings?.taxRate ?? 0.07875;

  const quote = await prisma.quote.create({
    data: {
      number,
      customerId: qr.customerId,
      vehicleId: qr.vehicleId,
      quoteRequestId: qr.id,
      status: "Draft",
      taxRate,
      notes: qr.notes,
      items: {
        create: (req.body.items || []).map((item: { tireId?: string; description: string; quantity: number; unitPrice: number; itemType?: string }) => ({
          tireId: item.tireId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          itemType: item.itemType || "tire",
        })),
      },
    },
    include: { items: true, customer: true, vehicle: true },
  });

  await prisma.quoteRequest.update({ where: { id: qr.id }, data: { status: "Quoted" } });
  res.status(201).json(quote);
});

// ---------- Quotes ----------
workflowRouter.get("/quotes", async (_req, res) => {
  const quotes = await prisma.quote.findMany({
    include: { customer: true, vehicle: true, items: { include: { tire: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    quotes.map((q) => ({
      ...q,
      totals: calcTotals(q.items, q.discount, q.taxRate),
    }))
  );
});

workflowRouter.get("/quotes/:id", async (req, res) => {
  const q = await prisma.quote.findUnique({
    where: { id: req.params.id },
    include: { customer: true, vehicle: true, items: { include: { tire: true } }, quoteRequest: true, serviceOrder: true },
  });
  if (!q) return res.status(404).json({ error: "Not found" });
  res.json({ ...q, totals: calcTotals(q.items, q.discount, q.taxRate) });
});

workflowRouter.post("/quotes", async (req, res) => {
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const number = await nextNumber(settings?.quotePrefix ?? "QTE", "quote");
  const taxRate = req.body.taxRate ?? settings?.taxRate ?? 0.07875;
  const quote = await prisma.quote.create({
    data: {
      number,
      customerId: req.body.customerId,
      vehicleId: req.body.vehicleId || null,
      status: req.body.status || "Draft",
      discount: Number(req.body.discount) || 0,
      taxRate,
      notes: req.body.notes || null,
      validUntil: req.body.validUntil || null,
      items: {
        create: (req.body.items || []).map((item: { tireId?: string; description: string; quantity: number; unitPrice: number; itemType?: string }) => ({
          tireId: item.tireId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          itemType: item.itemType || "service",
        })),
      },
    },
    include: { items: true, customer: true, vehicle: true },
  });
  res.status(201).json({ ...quote, totals: calcTotals(quote.items, quote.discount, quote.taxRate) });
});

workflowRouter.patch("/quotes/:id", async (req, res) => {
  const { items, ...rest } = req.body;
  if (items) {
    await prisma.quoteItem.deleteMany({ where: { quoteId: req.params.id } });
    await prisma.quoteItem.createMany({
      data: items.map((item: { tireId?: string; description: string; quantity: number; unitPrice: number; itemType?: string }) => ({
        quoteId: req.params.id,
        tireId: item.tireId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        itemType: item.itemType || "service",
      })),
    });
  }
  const quote = await prisma.quote.update({
    where: { id: req.params.id },
    data: rest,
    include: { items: { include: { tire: true } }, customer: true, vehicle: true },
  });
  if (rest.status === "Sent") {
    await createNotification({
      customerId: quote.customerId,
      type: "Quote Ready",
      title: "Quote ready",
      message: `Quote ${quote.number} is ready for review.`,
    });
  }
  res.json({ ...quote, totals: calcTotals(quote.items, quote.discount, quote.taxRate) });
});

workflowRouter.post("/quotes/:id/convert", async (req, res) => {
  const quote = await prisma.quote.findUnique({
    where: { id: req.params.id },
    include: { items: true, serviceOrder: true },
  });
  if (!quote) return res.status(404).json({ error: "Not found" });
  if (quote.status !== "Accepted" && req.body.force !== true) {
    return res.status(400).json({ error: "Quote must be Accepted before converting" });
  }
  if (quote.serviceOrder) return res.status(400).json({ error: "Already converted" });

  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const number = await nextNumber(settings?.servicePrefix ?? "SO", "serviceOrder");

  const so = await prisma.$transaction(async (tx) => {
    const itemCreates = [];
    for (const item of quote.items) {
      let cost = 0;
      let inventoryDeducted = false;
      if (item.tireId && item.itemType === "tire") {
        const tire = await tx.tire.findUnique({ where: { id: item.tireId } });
        if (!tire) throw new Error(`Tire not found for quote item: ${item.description}`);
        if (tire.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${tire.brand} ${tire.model} (need ${item.quantity}, have ${tire.quantity})`);
        }
        await tx.tire.update({ where: { id: item.tireId }, data: { quantity: { decrement: item.quantity } } });
        cost = tire.cost;
        inventoryDeducted = true;
      }
      itemCreates.push({
        tireId: item.tireId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        itemType: item.itemType,
        cost,
        inventoryDeducted,
      });
    }

    const created = await tx.serviceOrder.create({
      data: {
        number,
        customerId: quote.customerId,
        vehicleId: quote.vehicleId,
        quoteId: quote.id,
        status: "In Progress",
        discount: quote.discount,
        taxRate: quote.taxRate,
        complaint: quote.notes,
        items: { create: itemCreates },
      },
      include: { items: true, customer: true, vehicle: true },
    });
    await tx.quote.update({ where: { id: quote.id }, data: { status: "Converted" } });
    return created;
  }).catch((e: Error) => ({ error: e.message }));

  if ("error" in so) return res.status(400).json(so);
  res.status(201).json(so);
});

// ---------- Service Orders ----------
workflowRouter.get("/service-orders", async (_req, res) => {
  const list = await prisma.serviceOrder.findMany({
    include: { customer: true, vehicle: true, items: { include: { tire: true } }, appointment: true, invoice: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(list.map((so) => ({ ...so, totals: calcTotals(so.items, so.discount, so.taxRate) })));
});

workflowRouter.get("/service-orders/:id", async (req, res) => {
  const so = await prisma.serviceOrder.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      vehicle: true,
      items: { include: { tire: true } },
      appointment: true,
      quote: true,
      invoice: true,
    },
  });
  if (!so) return res.status(404).json({ error: "Not found" });
  res.json({ ...so, totals: calcTotals(so.items, so.discount, so.taxRate) });
});

workflowRouter.post("/service-orders", async (req, res) => {
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const number = await nextNumber(settings?.servicePrefix ?? "SO", "serviceOrder");
  const taxRate = settings?.taxRate ?? 0.07875;
  const so = await prisma.serviceOrder.create({
    data: {
      number,
      customerId: req.body.customerId,
      vehicleId: req.body.vehicleId || null,
      mileage: req.body.mileage != null ? Number(req.body.mileage) : null,
      complaint: req.body.complaint || null,
      inspectionNotes: req.body.inspectionNotes || null,
      technicianNotes: req.body.technicianNotes || null,
      recommendedServices: req.body.recommendedServices || null,
      status: "Open",
      taxRate,
      discount: Number(req.body.discount) || 0,
    },
    include: { customer: true, vehicle: true, items: true },
  });
  res.status(201).json({ ...so, totals: calcTotals(so.items, so.discount, so.taxRate) });
});

workflowRouter.patch("/service-orders/:id", async (req, res) => {
  const so = await prisma.serviceOrder.update({
    where: { id: req.params.id },
    data: {
      mileage: req.body.mileage,
      complaint: req.body.complaint,
      inspectionNotes: req.body.inspectionNotes,
      technicianNotes: req.body.technicianNotes,
      recommendedServices: req.body.recommendedServices,
      status: req.body.status,
      discount: req.body.discount,
    },
    include: { items: { include: { tire: true } }, customer: true, vehicle: true },
  });
  if (req.body.status === "Completed") {
    await createNotification({
      customerId: so.customerId,
      type: "Vehicle Ready",
      title: "Vehicle ready",
      message: `Service order ${so.number} is complete.`,
    });
  }
  res.json({ ...so, totals: calcTotals(so.items, so.discount, so.taxRate) });
});

workflowRouter.post("/service-orders/:id/items", async (req, res) => {
  const { tireId, description, quantity, unitPrice, itemType, cost } = req.body;
  const qty = Number(quantity) || 1;

  const result = await prisma.$transaction(async (tx) => {
    let tireCost = Number(cost) || 0;
    let inventoryDeducted = false;

    if (tireId && itemType === "tire") {
      const tire = await tx.tire.findUnique({ where: { id: tireId } });
      if (!tire) throw new Error("Tire not found");
      if (tire.quantity < qty) throw new Error(`Insufficient stock for ${tire.brand} ${tire.model}`);
      await tx.tire.update({ where: { id: tireId }, data: { quantity: { decrement: qty } } });
      tireCost = tire.cost;
      inventoryDeducted = true;
    }

    const item = await tx.serviceOrderItem.create({
      data: {
        serviceOrderId: req.params.id,
        tireId: tireId || null,
        description,
        quantity: qty,
        unitPrice: Number(unitPrice),
        cost: tireCost,
        itemType: itemType || "service",
        inventoryDeducted,
      },
      include: { tire: true },
    });

    await tx.serviceOrder.update({
      where: { id: req.params.id },
      data: { status: "In Progress" },
    });

    return item;
  }).catch((e: Error) => ({ error: e.message }));

  if ("error" in result) return res.status(400).json(result);
  const so = await prisma.serviceOrder.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { tire: true } }, customer: true, vehicle: true },
  });
  res.status(201).json({ item: result, order: { ...so!, totals: calcTotals(so!.items, so!.discount, so!.taxRate) } });
});

workflowRouter.delete("/service-orders/:id/items/:itemId", async (req, res) => {
  const item = await prisma.serviceOrderItem.findUnique({ where: { id: req.params.itemId } });
  if (!item) return res.status(404).json({ error: "Not found" });

  await prisma.$transaction(async (tx) => {
    if (item.inventoryDeducted && item.tireId) {
      await tx.tire.update({ where: { id: item.tireId }, data: { quantity: { increment: item.quantity } } });
    }
    await tx.serviceOrderItem.delete({ where: { id: item.id } });
  });

  const so = await prisma.serviceOrder.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { tire: true } } },
  });
  res.json({ ...so!, totals: calcTotals(so!.items, so!.discount, so!.taxRate) });
});

workflowRouter.post("/service-orders/:id/cancel", async (req, res) => {
  const so = await prisma.serviceOrder.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!so) return res.status(404).json({ error: "Not found" });
  if (so.status === "Invoiced") return res.status(400).json({ error: "Cannot cancel invoiced order" });

  await prisma.$transaction(async (tx) => {
    for (const item of so.items) {
      if (item.inventoryDeducted && item.tireId) {
        await tx.tire.update({ where: { id: item.tireId }, data: { quantity: { increment: item.quantity } } });
        await tx.serviceOrderItem.update({ where: { id: item.id }, data: { inventoryDeducted: false } });
      }
    }
    await tx.serviceOrder.update({ where: { id: so.id }, data: { status: "Cancelled" } });
  });

  res.json({ ok: true });
});

workflowRouter.post("/service-orders/:id/create-invoice", async (req, res) => {
  const so = await prisma.serviceOrder.findUnique({
    where: { id: req.params.id },
    include: { items: true, invoice: true },
  });
  if (!so) return res.status(404).json({ error: "Not found" });
  if (so.invoice) return res.status(400).json({ error: "Invoice already exists" });
  if (so.status === "Cancelled") return res.status(400).json({ error: "Cannot invoice cancelled order" });

  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const number = await nextNumber(settings?.invoicePrefix ?? "INV", "invoice");

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        number,
        customerId: so.customerId,
        vehicleId: so.vehicleId,
        serviceOrderId: so.id,
        status: "Unpaid",
        discount: so.discount,
        taxRate: so.taxRate,
        items: {
          create: so.items.map((item) => ({
            tireId: item.tireId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            itemType: item.itemType,
          })),
        },
      },
      include: { items: true, customer: true, vehicle: true, payments: true },
    });
    await tx.serviceOrder.update({ where: { id: so.id }, data: { status: "Invoiced" } });
    if (so.appointmentId) {
      await tx.appointment.update({ where: { id: so.appointmentId }, data: { status: "Completed" } });
    }
    return inv;
  });

  await createNotification({
    customerId: so.customerId,
    type: "Invoice Created",
    title: "Invoice created",
    message: `Invoice ${invoice.number} has been created.`,
  });

  res.status(201).json({ ...invoice, totals: calcTotals(invoice.items, invoice.discount, invoice.taxRate) });
});

// ---------- Invoices ----------
workflowRouter.get("/invoices", async (_req, res) => {
  const invoices = await prisma.invoice.findMany({
    include: { customer: true, vehicle: true, items: true, payments: true, serviceOrder: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    invoices.map((inv) => {
      const totals = calcTotals(inv.items, inv.discount, inv.taxRate);
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      return { ...inv, totals, amountPaid: paid, balance: Math.round((totals.total - paid) * 100) / 100 };
    })
  );
});

workflowRouter.get("/invoices/:id", async (req, res) => {
  const inv = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { customer: true, vehicle: true, items: true, payments: true, serviceOrder: true },
  });
  if (!inv) return res.status(404).json({ error: "Not found" });
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const totals = calcTotals(inv.items, inv.discount, inv.taxRate);
  const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
  res.json({
    ...inv,
    totals,
    amountPaid: paid,
    balance: Math.round((totals.total - paid) * 100) / 100,
    business: settings,
  });
});

workflowRouter.post("/invoices", async (req, res) => {
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const number = await nextNumber(settings?.invoicePrefix ?? "INV", "invoice");
  const taxRate = req.body.taxRate ?? settings?.taxRate ?? 0.07875;
  const inv = await prisma.invoice.create({
    data: {
      number,
      customerId: req.body.customerId,
      vehicleId: req.body.vehicleId || null,
      status: "Unpaid",
      discount: Number(req.body.discount) || 0,
      taxRate,
      notes: req.body.notes || null,
      items: {
        create: (req.body.items || []).map((item: { tireId?: string; description: string; quantity: number; unitPrice: number; itemType?: string }) => ({
          tireId: item.tireId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          itemType: item.itemType || "service",
        })),
      },
    },
    include: { items: true, customer: true, payments: true },
  });
  res.status(201).json({ ...inv, totals: calcTotals(inv.items, inv.discount, inv.taxRate) });
});

workflowRouter.post("/invoices/:id/payments", async (req, res) => {
  const inv = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { items: true, payments: true },
  });
  if (!inv) return res.status(404).json({ error: "Not found" });

  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

  await prisma.payment.create({
    data: {
      invoiceId: inv.id,
      amount,
      method: req.body.method || "Cash",
      notes: req.body.notes || null,
    },
  });

  const updated = await prisma.invoice.findUnique({
    where: { id: inv.id },
    include: { items: true, payments: true, customer: true, vehicle: true },
  });
  const totals = calcTotals(updated!.items, updated!.discount, updated!.taxRate);
  const paid = updated!.payments.reduce((s, p) => s + p.amount, 0);
  let status = "Unpaid";
  if (paid <= 0) status = "Unpaid";
  else if (paid + 0.001 >= totals.total) status = "Paid";
  else status = "Partially Paid";

  const final = await prisma.invoice.update({
    where: { id: inv.id },
    data: { status, paidAt: status === "Paid" ? new Date() : null },
    include: { items: true, payments: true, customer: true, vehicle: true },
  });

  res.json({
    ...final,
    totals,
    amountPaid: paid,
    balance: Math.round((totals.total - paid) * 100) / 100,
  });
});

workflowRouter.post("/invoices/:id/mark-paid", async (req, res) => {
  const inv = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { items: true, payments: true },
  });
  if (!inv) return res.status(404).json({ error: "Not found" });
  const totals = calcTotals(inv.items, inv.discount, inv.taxRate);
  const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.round((totals.total - paid) * 100) / 100;
  if (remaining > 0) {
    await prisma.payment.create({
      data: { invoiceId: inv.id, amount: remaining, method: req.body.method || "Card", notes: "Marked paid" },
    });
  }
  const final = await prisma.invoice.update({
    where: { id: inv.id },
    data: { status: "Paid", paidAt: new Date() },
    include: { items: true, payments: true, customer: true, vehicle: true },
  });
  res.json({ ...final, totals, amountPaid: totals.total, balance: 0 });
});

workflowRouter.patch("/invoices/:id", async (req, res) => {
  const inv = await prisma.invoice.update({
    where: { id: req.params.id },
    data: { status: req.body.status, notes: req.body.notes, discount: req.body.discount },
    include: { items: true, payments: true, customer: true },
  });
  res.json({ ...inv, totals: calcTotals(inv.items, inv.discount, inv.taxRate) });
});

// ---------- Reports ----------
workflowRouter.get("/reports", async (req, res) => {
  const period = String(req.query.period || "monthly");
  const now = new Date();
  let start: Date;
  if (period === "daily") {
    start = new Date(now.toISOString().slice(0, 10));
  } else if (period === "weekly") {
    start = new Date(now);
    start.setDate(start.getDate() - 7);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [invoices, serviceOrders, tires, appointments, allCustomers] = await Promise.all([
    prisma.invoice.findMany({ where: { issuedAt: { gte: start } }, include: { items: true, payments: true, customer: true } }),
    prisma.serviceOrder.findMany({ where: { createdAt: { gte: start } }, include: { items: true } }),
    prisma.tire.findMany(),
    prisma.appointment.findMany({ where: { date: { gte: start.toISOString().slice(0, 10) } } }),
    prisma.customer.findMany({ include: { invoices: true, appointments: true } }),
  ]);
  const newCustomers = allCustomers.filter((c) => c.createdAt >= start).length;
  const returning = allCustomers.filter((c) => c.createdAt < start && (c.invoices.length > 0 || c.appointments.length > 0)).length;

  const revenue = invoices.reduce((s, inv) => s + inv.payments.reduce((p, pay) => p + pay.amount, 0), 0);
  const tireCost = serviceOrders.reduce(
    (s, so) => s + so.items.filter((i) => i.itemType === "tire").reduce((q, i) => q + i.cost * i.quantity, 0),
    0
  );
  const serviceRevenue = invoices.reduce(
    (s, inv) => s + inv.items.filter((i) => i.itemType === "service").reduce((q, i) => q + i.unitPrice * i.quantity, 0),
    0
  );
  const tireRevenue = invoices.reduce(
    (s, inv) => s + inv.items.filter((i) => i.itemType === "tire").reduce((q, i) => q + i.unitPrice * i.quantity, 0),
    0
  );

  const brandMap: Record<string, number> = {};
  for (const inv of invoices) {
    for (const item of inv.items.filter((i) => i.itemType === "tire")) {
      const brand = item.description.split(" ")[0] || "Other";
      brandMap[brand] = (brandMap[brand] || 0) + item.quantity;
    }
  }
  const serviceMap: Record<string, number> = {};
  for (const so of serviceOrders) {
    for (const item of so.items.filter((i) => i.itemType === "service")) {
      serviceMap[item.description] = (serviceMap[item.description] || 0) + item.quantity;
    }
  }

  res.json({
    period,
    revenue: Math.round(revenue * 100) / 100,
    tireRevenue: Math.round(tireRevenue * 100) / 100,
    serviceRevenue: Math.round(serviceRevenue * 100) / 100,
    tireCost: Math.round(tireCost * 100) / 100,
    profit: Math.round((revenue - tireCost) * 100) / 100,
    appointmentCount: appointments.length,
    serviceOrderCount: serviceOrders.length,
    bestSellingBrands: Object.entries(brandMap)
      .map(([brand, qty]) => ({ brand, qty }))
      .sort((a, b) => b.qty - a.qty),
    topServices: Object.entries(serviceMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty),
    customers: { new: newCustomers, returning },
    inventory: {
      lowStock: tires.filter((t) => t.quantity > 0 && t.quantity <= 4).map((t) => ({ ...t, stockStatus: stockStatus(t.quantity) })),
      outOfStock: tires.filter((t) => t.quantity <= 0).map((t) => ({ ...t, stockStatus: stockStatus(t.quantity) })),
    },
  });
});

// ---------- Settings ----------
workflowRouter.get("/settings", async (_req, res) => {
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  if (!settings) return res.status(404).json({ error: "Not found" });
  res.json({
    ...settings,
    hours: JSON.parse(settings.hoursJson),
    servicePrices: JSON.parse(settings.servicePricesJson),
  });
});

workflowRouter.put("/settings", async (req, res) => {
  const data = req.body;
  const settings = await prisma.businessSettings.update({
    where: { id: "default" },
    data: {
      name: data.name,
      addressLine1: data.addressLine1,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country,
      phone: data.phone,
      email: data.email,
      taxRate: data.taxRate != null ? Number(data.taxRate) : undefined,
      invoicePrefix: data.invoicePrefix,
      quotePrefix: data.quotePrefix,
      servicePrefix: data.servicePrefix,
      appointmentPrefix: data.appointmentPrefix,
      hoursJson: data.hours ? JSON.stringify(data.hours) : undefined,
      servicePricesJson: data.servicePrices ? JSON.stringify(data.servicePrices) : undefined,
      notifyEmail: data.notifyEmail,
      notifySms: data.notifySms,
    },
  });
  res.json({
    ...settings,
    hours: JSON.parse(settings.hoursJson),
    servicePrices: JSON.parse(settings.servicePricesJson),
  });
});

workflowRouter.get("/notifications", async (_req, res) => {
  const list = await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  res.json(list);
});

void getTaxRate;
