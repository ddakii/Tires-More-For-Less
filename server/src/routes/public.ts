import { Router } from "express";
import { prisma, stockStatus, createNotification, nextNumber, calcTotals } from "../lib.js";
import { requireAuth } from "../auth.js";

export const publicRouter = Router();

publicRouter.get("/business", async (_req, res) => {
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  if (!settings) return res.status(404).json({ error: "Not configured" });
  res.json({
    ...settings,
    hours: JSON.parse(settings.hoursJson),
    servicePrices: JSON.parse(settings.servicePricesJson),
  });
});

publicRouter.get("/tires", async (req, res) => {
  const { width, aspectRatio, diameter, season, type, brand, q } = req.query;
  const where: Record<string, unknown> = {};
  if (width) where.width = Number(width);
  if (aspectRatio) where.aspectRatio = Number(aspectRatio);
  if (diameter) where.diameter = Number(diameter);
  if (season) where.season = String(season);
  if (type) where.type = String(type);
  if (brand) where.brand = { contains: String(brand) };
  if (q) {
    const term = String(q);
    where.OR = [
      { brand: { contains: term } },
      { model: { contains: term } },
      { size: { contains: term } },
      { sku: { contains: term } },
    ];
  }
  const tires = await prisma.tire.findMany({ where, orderBy: [{ brand: "asc" }, { model: "asc" }] });
  res.json(
    tires.map((t) => ({
      ...t,
      stockStatus: stockStatus(t.quantity),
      profit: Math.round((t.price - t.cost) * 100) / 100,
    }))
  );
});

publicRouter.get("/tires/:id", async (req, res) => {
  const tire = await prisma.tire.findUnique({ where: { id: req.params.id } });
  if (!tire) return res.status(404).json({ error: "Tire not found" });
  res.json({ ...tire, stockStatus: stockStatus(tire.quantity), profit: Math.round((tire.price - tire.cost) * 100) / 100 });
});

publicRouter.get("/services", async (_req, res) => {
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const prices = settings ? JSON.parse(settings.servicePricesJson) : {};
  res.json([
    { id: "installation", name: "Tire Installation", description: "Professional mounting and installation.", price: prices["Tire Installation"] ?? 25 },
    { id: "flat-repair", name: "Flat Tire Repair", description: "Fast inspection and repair when possible.", price: prices["Flat Tire Repair"] ?? 35 },
    { id: "rotation", name: "Tire Rotation", description: "Help extend tire life and maintain even wear.", price: prices["Tire Rotation"] ?? 25 },
    { id: "balancing", name: "Tire Balancing", description: "Improve ride quality and reduce vibration.", price: prices["Tire Balancing"] ?? 20 },
    { id: "inspection", name: "Tire Inspection", description: "Check tread depth, tire pressure, wear and overall condition.", price: prices["Tire Inspection"] ?? 0 },
    { id: "replacement", name: "Tire Replacement", description: "Help customers choose the correct replacement tire.", price: prices["Tire Replacement"] ?? 0 },
    { id: "same-day", name: "Same-Day Tire Help", description: "Priority help during business hours when schedules allow.", price: null },
  ]);
});

publicRouter.post("/appointments", async (req, res) => {
  const {
    firstName, lastName, phone, email,
    year, make, model, tireSize,
    serviceType, date, time, notes,
  } = req.body;

  if (!firstName || !lastName || !phone || !serviceType || !date || !time) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let customer = await prisma.customer.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { firstName, lastName, phone, email: email || null },
    });
  }

  let vehicleId: string | undefined;
  if (year && make && model) {
    const vehicle = await prisma.vehicle.create({
      data: {
        customerId: customer.id,
        year: Number(year),
        make,
        model,
        tireSize: tireSize || null,
      },
    });
    vehicleId = vehicle.id;
  }

  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const number = await nextNumber(settings?.appointmentPrefix ?? "APT", "appointment");

  const appointment = await prisma.appointment.create({
    data: {
      number,
      customerId: customer.id,
      vehicleId,
      serviceType,
      date,
      time,
      status: "Requested",
      notes: notes || null,
      tireSize: tireSize || null,
    },
    include: { customer: true, vehicle: true },
  });

  await createNotification({
    customerId: customer.id,
    type: "Appointment Requested",
    title: "Appointment request received",
    message: `${firstName} ${lastName} requested ${serviceType} on ${date} at ${time}.`,
  });

  res.status(201).json(appointment);
});

publicRouter.get("/appointment-slots", async (req, res) => {
  const date = String(req.query.date || "");
  if (!date) return res.status(400).json({ error: "date required" });
  const d = new Date(date + "T12:00:00");
  const day = d.getDay(); // 0 Sun
  if (day === 0) return res.json({ slots: [], closed: true, message: "Closed on Sunday" });

  const weekdaySlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"];
  const saturdaySlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
  const all = day === 6 ? saturdaySlots : weekdaySlots;

  const booked = await prisma.appointment.findMany({
    where: { date, status: { notIn: ["Cancelled", "No Show"] } },
    select: { time: true },
  });
  const taken = new Set(booked.map((b) => b.time));
  res.json({ slots: all.filter((s) => !taken.has(s)), closed: false });
});

publicRouter.post("/quote-requests", async (req, res) => {
  const {
    name, phone, email, vehicleInfo, tireSize, quantity,
    preference, preferredBrand, budget, notes,
    year, make, model,
  } = req.body;

  if (!name || !phone) return res.status(400).json({ error: "Name and phone required" });

  const [firstName, ...rest] = String(name).trim().split(/\s+/);
  const lastName = rest.join(" ") || "Customer";

  let customer = await prisma.customer.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { firstName, lastName, phone, email: email || null },
    });
  }

  let vehicleId: string | undefined;
  let vehicleStr = vehicleInfo || null;
  if (year && make && model) {
    const vehicle = await prisma.vehicle.create({
      data: {
        customerId: customer.id,
        year: Number(year),
        make,
        model,
        tireSize: tireSize || null,
      },
    });
    vehicleId = vehicle.id;
    vehicleStr = `${year} ${make} ${model}`;
  }

  const qr = await prisma.quoteRequest.create({
    data: {
      customerId: customer.id,
      vehicleId,
      name,
      phone,
      email: email || null,
      vehicleInfo: vehicleStr,
      tireSize: tireSize || null,
      quantity: Number(quantity) || 4,
      preference: preference || null,
      preferredBrand: preferredBrand || null,
      budget: budget || null,
      notes: notes || null,
      status: "New",
    },
  });

  await createNotification({
    customerId: customer.id,
    type: "Quote Ready",
    title: "New quote request",
    message: `${name} requested a tire quote${tireSize ? ` for ${tireSize}` : ""}.`,
  });

  res.status(201).json(qr);
});

publicRouter.get("/portal/:token", async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { portalToken: req.params.token },
    include: {
      vehicles: true,
      appointments: { orderBy: { date: "desc" }, take: 20 },
      quotes: { include: { items: true }, orderBy: { createdAt: "desc" }, take: 20 },
      invoices: { include: { items: true, payments: true }, orderBy: { createdAt: "desc" }, take: 20 },
      serviceOrders: { include: { items: true }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!customer) return res.status(404).json({ error: "Portal not found" });
  res.json(customer);
});

// Admin-only helper reused by CRM for public-compatible tire mapping
publicRouter.get("/health", (_req, res) => res.json({ ok: true }));

export { requireAuth };
