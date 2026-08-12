import { Router } from "express";
import { prisma, stockStatus, nextNumber, calcTotals, createNotification } from "../lib.js";
import { requireAuth } from "../auth.js";

export const crmRouter = Router();
crmRouter.use(requireAuth);

function withTireMeta<T extends { quantity: number; price: number; cost: number }>(t: T) {
  return { ...t, stockStatus: stockStatus(t.quantity), profit: Math.round((t.price - t.cost) * 100) / 100 };
}

// ---------- Dashboard ----------
crmRouter.get("/dashboard", async (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";

  const [todaysAppointments, pendingQuotes, openOrders, monthInvoices, tires, recentAppts, notifications] =
    await Promise.all([
      prisma.appointment.count({ where: { date: today, status: { notIn: ["Cancelled"] } } }),
      prisma.quoteRequest.count({ where: { status: { in: ["New", "Reviewed"] } } }),
      prisma.serviceOrder.count({ where: { status: { in: ["Open", "In Progress"] } } }),
      prisma.invoice.findMany({
        where: { issuedAt: { gte: new Date(monthStart) }, status: { in: ["Paid", "Partially Paid"] } },
        include: { items: true, payments: true },
      }),
      prisma.tire.findMany(),
      prisma.appointment.findMany({
        where: { date: today },
        include: { customer: true, vehicle: true },
        orderBy: { time: "asc" },
      }),
      prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ]);

  const revenueThisMonth = monthInvoices.reduce((s, inv) => s + inv.payments.reduce((p, pay) => p + pay.amount, 0), 0);
  const tiresSoldThisMonth = monthInvoices.reduce(
    (s, inv) => s + inv.items.filter((i) => i.itemType === "tire").reduce((q, i) => q + i.quantity, 0),
    0
  );

  // Simple chart series for last 7 days
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const invoicesWeek = await prisma.invoice.findMany({
    where: { issuedAt: { gte: new Date(days[0]) } },
    include: { payments: true, items: true },
  });
  const apptsWeek = await prisma.appointment.findMany({ where: { date: { gte: days[0] } } });
  const ordersWeek = await prisma.serviceOrder.findMany({ where: { createdAt: { gte: new Date(days[0]) } } });

  const revenueByDay = days.map((day) => ({
    date: day,
    revenue: invoicesWeek
      .filter((inv) => inv.issuedAt.toISOString().slice(0, 10) === day)
      .reduce((s, inv) => s + inv.payments.reduce((p, pay) => p + pay.amount, 0), 0),
    tireSales: invoicesWeek
      .filter((inv) => inv.issuedAt.toISOString().slice(0, 10) === day)
      .reduce((s, inv) => s + inv.items.filter((i) => i.itemType === "tire").reduce((q, i) => q + i.quantity, 0), 0),
    appointments: apptsWeek.filter((a) => a.date === day).length,
    serviceOrders: ordersWeek.filter((o) => o.createdAt.toISOString().slice(0, 10) === day).length,
  }));

  res.json({
    metrics: {
      todaysAppointments,
      pendingQuoteRequests: pendingQuotes,
      tiresSoldThisMonth,
      openServiceOrders: openOrders,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      lowStock: tires.filter((t) => t.quantity > 0 && t.quantity <= 4).length,
      outOfStock: tires.filter((t) => t.quantity <= 0).length,
    },
    todaysSchedule: recentAppts,
    revenueByDay,
    notifications,
    demoNotice: "Sample/demo data for Tires & More For Less",
  });
});

// ---------- Global Search ----------
crmRouter.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ customers: [], vehicles: [], invoices: [], quotes: [], serviceOrders: [], appointments: [] });

  const [customers, vehicles, invoices, quotes, serviceOrders, appointments] = await Promise.all([
    prisma.customer.findMany({
      where: {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 10,
    }),
    prisma.vehicle.findMany({
      where: {
        OR: [
          { make: { contains: q } },
          { model: { contains: q } },
          { vin: { contains: q } },
          { licensePlate: { contains: q } },
          { tireSize: { contains: q } },
        ],
      },
      include: { customer: true },
      take: 10,
    }),
    prisma.invoice.findMany({ where: { number: { contains: q } }, take: 10, include: { customer: true } }),
    prisma.quote.findMany({ where: { number: { contains: q } }, take: 10, include: { customer: true } }),
    prisma.serviceOrder.findMany({ where: { number: { contains: q } }, take: 10, include: { customer: true } }),
    prisma.appointment.findMany({ where: { number: { contains: q } }, take: 10, include: { customer: true } }),
  ]);

  res.json({ customers, vehicles, invoices, quotes, serviceOrders, appointments });
});

// ---------- Customers ----------
crmRouter.get("/customers", async (req, res) => {
  const customers = await prisma.customer.findMany({
    include: {
      vehicles: true,
      invoices: { include: { payments: true } },
      appointments: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { lastName: "asc" },
  });
  res.json(
    customers.map((c) => {
      const totalSpent = c.invoices.reduce((s, inv) => s + inv.payments.reduce((p, pay) => p + pay.amount, 0), 0);
      return {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        email: c.email,
        status: c.status,
        vehicleCount: c.vehicles.length,
        vehicles: c.vehicles,
        lastVisit: c.appointments[0]?.date ?? null,
        totalSpent: Math.round(totalSpent * 100) / 100,
      };
    })
  );
});

crmRouter.get("/customers/:id", async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      vehicles: true,
      appointments: { orderBy: [{ date: "desc" }, { time: "desc" }], include: { vehicle: true } },
      quotes: { include: { items: true, vehicle: true }, orderBy: { createdAt: "desc" } },
      quoteRequests: { orderBy: { createdAt: "desc" } },
      serviceOrders: { include: { items: true, vehicle: true }, orderBy: { createdAt: "desc" } },
      invoices: { include: { items: true, payments: true, vehicle: true }, orderBy: { createdAt: "desc" } },
      notesList: { orderBy: { createdAt: "desc" } },
      communications: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) return res.status(404).json({ error: "Not found" });
  const purchasedTires = customer.serviceOrders.flatMap((so) =>
    so.items.filter((i) => i.itemType === "tire").map((i) => ({ ...i, serviceOrderNumber: so.number, date: so.createdAt }))
  );
  const totalSpent = customer.invoices.reduce((s, inv) => s + inv.payments.reduce((p, pay) => p + pay.amount, 0), 0);
  res.json({ ...customer, purchasedTires, totalSpent: Math.round(totalSpent * 100) / 100 });
});

crmRouter.post("/customers", async (req, res) => {
  const { firstName, lastName, phone, email, status, notes } = req.body;
  if (!firstName || !lastName || !phone) return res.status(400).json({ error: "Required fields missing" });
  const customer = await prisma.customer.create({
    data: { firstName, lastName, phone, email: email || null, status: status || "Active", notes: notes || null },
  });
  res.status(201).json(customer);
});

crmRouter.put("/customers/:id", async (req, res) => {
  const { firstName, lastName, phone, email, status, notes } = req.body;
  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: { firstName, lastName, phone, email, status, notes },
  });
  res.json(customer);
});

crmRouter.post("/customers/:id/notes", async (req, res) => {
  const note = await prisma.customerNote.create({
    data: { customerId: req.params.id, content: req.body.content, createdBy: req.user?.name },
  });
  res.status(201).json(note);
});

crmRouter.post("/customers/:id/communications", async (req, res) => {
  const { channel, direction, subject, body } = req.body;
  const c = await prisma.communication.create({
    data: { customerId: req.params.id, channel, direction, subject, body },
  });
  res.status(201).json(c);
});

// ---------- Vehicles ----------
crmRouter.get("/vehicles", async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    include: { customer: true, serviceOrders: { include: { items: true }, orderBy: { createdAt: "desc" } } },
    orderBy: { updatedAt: "desc" },
  });
  res.json(vehicles);
});

crmRouter.post("/vehicles", async (req, res) => {
  const vehicle = await prisma.vehicle.create({ data: req.body });
  res.status(201).json(vehicle);
});

crmRouter.put("/vehicles/:id", async (req, res) => {
  const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body });
  res.json(vehicle);
});

crmRouter.get("/vehicles/:id", async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      appointments: { orderBy: { date: "desc" } },
      serviceOrders: { include: { items: true }, orderBy: { createdAt: "desc" } },
      invoices: { include: { items: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!vehicle) return res.status(404).json({ error: "Not found" });
  res.json(vehicle);
});

// ---------- Tires / Inventory ----------
crmRouter.get("/tires", async (req, res) => {
  const { width, aspectRatio, diameter, q } = req.query;
  const where: Record<string, unknown> = {};
  if (width) where.width = Number(width);
  if (aspectRatio) where.aspectRatio = Number(aspectRatio);
  if (diameter) where.diameter = Number(diameter);
  if (q) {
    const term = String(q);
    where.OR = [{ brand: { contains: term } }, { model: { contains: term } }, { size: { contains: term } }, { sku: { contains: term } }];
  }
  const tires = await prisma.tire.findMany({ where, orderBy: [{ brand: "asc" }, { model: "asc" }] });
  res.json(tires.map(withTireMeta));
});

crmRouter.get("/tires/:id", async (req, res) => {
  const tire = await prisma.tire.findUnique({ where: { id: req.params.id } });
  if (!tire) return res.status(404).json({ error: "Not found" });
  res.json(withTireMeta(tire));
});

crmRouter.post("/tires", async (req, res) => {
  const data = req.body;
  const size = data.size || `${data.width}/${data.aspectRatio}R${data.diameter}`;
  const tire = await prisma.tire.create({
    data: {
      brand: data.brand,
      model: data.model,
      width: Number(data.width),
      aspectRatio: Number(data.aspectRatio),
      diameter: Number(data.diameter),
      size,
      season: data.season,
      type: data.type || "New",
      loadIndex: data.loadIndex || null,
      speedRating: data.speedRating || null,
      cost: Number(data.cost),
      price: Number(data.price),
      quantity: Number(data.quantity) || 0,
      supplier: data.supplier || null,
      sku: data.sku,
      warranty: data.warranty || null,
      notes: data.notes || null,
    },
  });
  res.status(201).json(withTireMeta(tire));
});

crmRouter.put("/tires/:id", async (req, res) => {
  const data = req.body;
  const tire = await prisma.tire.update({
    where: { id: req.params.id },
    data: {
      brand: data.brand,
      model: data.model,
      width: data.width != null ? Number(data.width) : undefined,
      aspectRatio: data.aspectRatio != null ? Number(data.aspectRatio) : undefined,
      diameter: data.diameter != null ? Number(data.diameter) : undefined,
      size: data.size,
      season: data.season,
      type: data.type,
      loadIndex: data.loadIndex,
      speedRating: data.speedRating,
      cost: data.cost != null ? Number(data.cost) : undefined,
      price: data.price != null ? Number(data.price) : undefined,
      quantity: data.quantity != null ? Number(data.quantity) : undefined,
      supplier: data.supplier,
      sku: data.sku,
      warranty: data.warranty,
      notes: data.notes,
    },
  });
  res.json(withTireMeta(tire));
});

crmRouter.delete("/tires/:id", async (req, res) => {
  await prisma.tire.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export { withTireMeta, calcTotals, nextNumber, createNotification, prisma };
