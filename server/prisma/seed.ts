import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const HOURS = {
  monday: { open: "9:00 AM", close: "6:30 PM", closed: false },
  tuesday: { open: "9:00 AM", close: "6:30 PM", closed: false },
  wednesday: { open: "9:00 AM", close: "6:30 PM", closed: false },
  thursday: { open: "9:00 AM", close: "6:30 PM", closed: false },
  friday: { open: "9:00 AM", close: "6:30 PM", closed: false },
  saturday: { open: "9:00 AM", close: "3:00 PM", closed: false },
  sunday: { open: null, close: null, closed: true },
};

const SERVICE_PRICES = {
  "Tire Installation": 25,
  "Flat Tire Repair": 35,
  "Tire Rotation": 25,
  "Tire Balancing": 20,
  "Tire Inspection": 0,
  "Tire Replacement": 0,
  "Mount & Balance (per tire)": 30,
};

const tires = [
  { brand: "Michelin", model: "Defender2", width: 225, aspectRatio: 65, diameter: 17, season: "All-Season", type: "New", loadIndex: "102", speedRating: "H", cost: 142, price: 189.99, quantity: 16, supplier: "Michelin Dist.", sku: "MICH-DEF2-2256517", warranty: "60,000 mile limited" },
  { brand: "Michelin", model: "CrossClimate2", width: 225, aspectRatio: 65, diameter: 17, season: "All-Season", type: "New", loadIndex: "102", speedRating: "H", cost: 155, price: 209.99, quantity: 8, supplier: "Michelin Dist.", sku: "MICH-CC2-2256517", warranty: "60,000 mile limited" },
  { brand: "Goodyear", model: "Assurance WeatherReady", width: 225, aspectRatio: 65, diameter: 17, season: "All-Season", type: "New", loadIndex: "102", speedRating: "H", cost: 128, price: 169.99, quantity: 12, supplier: "Goodyear", sku: "GY-AWR-2256517", warranty: "60,000 mile limited" },
  { brand: "Bridgestone", model: "Turanza QuietTrack", width: 225, aspectRatio: 60, diameter: 16, season: "All-Season", type: "New", loadIndex: "98", speedRating: "H", cost: 118, price: 159.99, quantity: 10, supplier: "Bridgestone", sku: "BS-TQT-2256016", warranty: "80,000 mile limited" },
  { brand: "Continental", model: "TrueContact Tour", width: 215, aspectRatio: 55, diameter: 17, season: "All-Season", type: "New", loadIndex: "94", speedRating: "V", cost: 112, price: 149.99, quantity: 14, supplier: "Continental", sku: "CONT-TCT-2155517", warranty: "70,000 mile limited" },
  { brand: "Hankook", model: "Kinergy PT", width: 205, aspectRatio: 55, diameter: 16, season: "All-Season", type: "New", loadIndex: "91", speedRating: "H", cost: 78, price: 109.99, quantity: 20, supplier: "Hankook", sku: "HK-KPT-2055516", warranty: "70,000 mile limited" },
  { brand: "Toyo", model: "Celsius II", width: 235, aspectRatio: 55, diameter: 18, season: "All-Season", type: "New", loadIndex: "100", speedRating: "V", cost: 135, price: 179.99, quantity: 6, supplier: "Toyo", sku: "TOYO-CEL2-2355518", warranty: "60,000 mile limited" },
  { brand: "Pirelli", model: "P4 Persist AS Plus", width: 225, aspectRatio: 45, diameter: 17, season: "All-Season", type: "New", loadIndex: "91", speedRating: "H", cost: 98, price: 134.99, quantity: 9, supplier: "Pirelli", sku: "PIR-P4-2254517", warranty: "90,000 mile limited" },
  { brand: "Falken", model: "Wildpeak A/T Trail", width: 245, aspectRatio: 65, diameter: 17, season: "All-Terrain", type: "New", loadIndex: "107", speedRating: "S", cost: 145, price: 194.99, quantity: 7, supplier: "Falken", sku: "FALK-WAT-2456517", warranty: "60,000 mile limited" },
  { brand: "BFGoodrich", model: "All-Terrain T/A KO2", width: 265, aspectRatio: 70, diameter: 17, season: "All-Terrain", type: "New", loadIndex: "121", speedRating: "S", cost: 198, price: 269.99, quantity: 4, supplier: "BFGoodrich", sku: "BFG-KO2-2657017", warranty: "50,000 mile limited" },
  { brand: "Nokian", model: "Hakkapeliitta R5", width: 225, aspectRatio: 65, diameter: 17, season: "Winter", type: "New", loadIndex: "102", speedRating: "R", cost: 168, price: 224.99, quantity: 8, supplier: "Nokian", sku: "NOK-HR5-2256517", warranty: "One season / treadwear" },
  { brand: "Michelin", model: "X-Ice Snow", width: 215, aspectRatio: 60, diameter: 16, season: "Winter", type: "New", loadIndex: "95", speedRating: "T", cost: 148, price: 199.99, quantity: 5, supplier: "Michelin Dist.", sku: "MICH-XIS-2156016", warranty: "40,000 mile limited" },
  { brand: "Goodyear", model: "WinterCommand Ultra", width: 225, aspectRatio: 60, diameter: 17, season: "Winter", type: "New", loadIndex: "99", speedRating: "H", cost: 138, price: 184.99, quantity: 3, supplier: "Goodyear", sku: "GY-WCU-2256017", warranty: "Tread life limited" },
  { brand: "Firestone", model: "Destination LE3", width: 235, aspectRatio: 65, diameter: 17, season: "All-Season", type: "New", loadIndex: "104", speedRating: "H", cost: 105, price: 139.99, quantity: 11, supplier: "Firestone", sku: "FS-DLE3-2356517", warranty: "70,000 mile limited" },
  { brand: "Cooper", model: "CS5 Ultra Touring", width: 225, aspectRatio: 55, diameter: 17, season: "All-Season", type: "New", loadIndex: "97", speedRating: "V", cost: 92, price: 124.99, quantity: 13, supplier: "Cooper", sku: "COP-CS5-2255517", warranty: "80,000 mile limited" },
  { brand: "Yokohama", model: "Avid Ascend GT", width: 205, aspectRatio: 60, diameter: 16, season: "All-Season", type: "New", loadIndex: "92", speedRating: "H", cost: 85, price: 114.99, quantity: 15, supplier: "Yokohama", sku: "YOK-AAGT-2056016", warranty: "65,000 mile limited" },
  { brand: "General", model: "Altimax RT43", width: 195, aspectRatio: 65, diameter: 15, season: "All-Season", type: "New", loadIndex: "91", speedRating: "T", cost: 68, price: 94.99, quantity: 18, supplier: "General", sku: "GEN-RT43-1956515", warranty: "75,000 mile limited" },
  { brand: "Kumho", model: "Solus TA31", width: 215, aspectRatio: 55, diameter: 17, season: "All-Season", type: "New", loadIndex: "94", speedRating: "V", cost: 72, price: 99.99, quantity: 2, supplier: "Kumho", sku: "KUM-TA31-2155517", warranty: "60,000 mile limited" },
  { brand: "Used Take-Off", model: "All-Season Set", width: 225, aspectRatio: 65, diameter: 17, season: "All-Season", type: "Used", loadIndex: "102", speedRating: "H", cost: 35, price: 69.99, quantity: 8, supplier: "Local take-offs", sku: "USED-AS-2256517", warranty: "As-is, inspected" },
  { brand: "Used Take-Off", model: "SUV Match Pair", width: 235, aspectRatio: 65, diameter: 17, season: "All-Season", type: "Used", loadIndex: "104", speedRating: "H", cost: 40, price: 79.99, quantity: 6, supplier: "Local take-offs", sku: "USED-SUV-2356517", warranty: "As-is, inspected" },
  { brand: "Michelin", model: "Pilot Sport 4", width: 245, aspectRatio: 40, diameter: 18, season: "Summer", type: "New", loadIndex: "97", speedRating: "Y", cost: 178, price: 239.99, quantity: 4, supplier: "Michelin Dist.", sku: "MICH-PS4-2454018", warranty: "30,000 mile limited" },
  { brand: "Goodyear", model: "Eagle Sport All-Season", width: 225, aspectRatio: 50, diameter: 17, season: "All-Season", type: "New", loadIndex: "94", speedRating: "V", cost: 102, price: 139.99, quantity: 0, supplier: "Goodyear", sku: "GY-ESAS-2255017", warranty: "50,000 mile limited" },
  { brand: "Bridgestone", model: "Dueler H/L Alenza Plus", width: 255, aspectRatio: 55, diameter: 18, season: "All-Season", type: "New", loadIndex: "109", speedRating: "H", cost: 162, price: 219.99, quantity: 5, supplier: "Bridgestone", sku: "BS-DHL-2555518", warranty: "80,000 mile limited" },
  { brand: "Continental", model: "TerrainContact A/T", width: 265, aspectRatio: 65, diameter: 17, season: "All-Terrain", type: "New", loadIndex: "112", speedRating: "T", cost: 155, price: 209.99, quantity: 7, supplier: "Continental", sku: "CONT-TCAT-2656517", warranty: "60,000 mile limited" },
  { brand: "Nitto", model: "Ridge Grappler", width: 275, aspectRatio: 65, diameter: 18, season: "All-Terrain", type: "New", loadIndex: "116", speedRating: "T", cost: 210, price: 289.99, quantity: 3, supplier: "Nitto", sku: "NIT-RG-2756518", warranty: "50,000 mile limited" },
];

const customers = [
  { firstName: "James", lastName: "Olson", phone: "612-555-0142", email: "james.olson@email.com", status: "Active" },
  { firstName: "Maria", lastName: "Santos", phone: "612-555-0198", email: "maria.santos@email.com", status: "Active" },
  { firstName: "Robert", lastName: "Nguyen", phone: "763-555-0111", email: "robert.nguyen@email.com", status: "Active" },
  { firstName: "Aisha", lastName: "Johnson", phone: "612-555-0177", email: "aisha.j@email.com", status: "Active" },
  { firstName: "Derek", lastName: "Peterson", phone: "651-555-0133", email: "derek.p@email.com", status: "Active" },
  { firstName: "Linda", lastName: "Kowalski", phone: "612-555-0166", email: "linda.k@email.com", status: "Active" },
  { firstName: "Carlos", lastName: "Ramirez", phone: "763-555-0188", email: "carlos.r@email.com", status: "Active" },
  { firstName: "Emily", lastName: "Bergstrom", phone: "612-555-0121", email: "emily.b@email.com", status: "Active" },
  { firstName: "Marcus", lastName: "Williams", phone: "651-555-0144", email: "marcus.w@email.com", status: "Active" },
  { firstName: "Sofia", lastName: "Andersson", phone: "612-555-0155", email: "sofia.a@email.com", status: "Active" },
  { firstName: "Tony", lastName: "Martinez", phone: "763-555-0199", email: "tony.m@email.com", status: "Active" },
  { firstName: "Rachel", lastName: "Kim", phone: "612-555-0102", email: "rachel.kim@email.com", status: "Active" },
  { firstName: "David", lastName: "Thompson", phone: "651-555-0170", email: "david.t@email.com", status: "Inactive" },
  { firstName: "Priya", lastName: "Patel", phone: "612-555-0181", email: "priya.patel@email.com", status: "Active" },
  { firstName: "Chris", lastName: "Henderson", phone: "763-555-0123", email: "chris.h@email.com", status: "Active" },
  // Demo journey customer for 225/65R17 CR-V quote → service → invoice
  { firstName: "Jordan", lastName: "Mitchell", phone: "612-555-2256", email: "jordan.mitchell@email.com", status: "Active", notes: "Demo journey customer: quote → install → paid invoice for 2019 Honda CR-V 225/65R17" },
];

const vehicleTemplates = [
  { year: 2019, make: "Honda", model: "CR-V", trim: "EX", tireSize: "225/65R17", mileage: 68420 },
  { year: 2016, make: "Toyota", model: "Camry", trim: "SE", tireSize: "215/55R17", mileage: 92110 },
  { year: 2021, make: "Ford", model: "F-150", trim: "XLT", tireSize: "265/70R17", mileage: 41200 },
  { year: 2018, make: "Subaru", model: "Outback", trim: "Premium", tireSize: "225/65R17", mileage: 74300 },
  { year: 2020, make: "Chevrolet", model: "Equinox", trim: "LT", tireSize: "225/65R17", mileage: 52800 },
  { year: 2015, make: "Nissan", model: "Altima", trim: "SV", tireSize: "215/55R17", mileage: 110450 },
  { year: 2022, make: "Hyundai", model: "Tucson", trim: "SEL", tireSize: "235/55R18", mileage: 28900 },
  { year: 2017, make: "Jeep", model: "Cherokee", trim: "Latitude", tireSize: "225/60R17", mileage: 87500 },
  { year: 2014, make: "Honda", model: "Civic", trim: "LX", tireSize: "205/55R16", mileage: 128300 },
  { year: 2019, make: "Toyota", model: "RAV4", trim: "XLE", tireSize: "225/65R17", mileage: 55600 },
  { year: 2020, make: "Kia", model: "Sorento", trim: "EX", tireSize: "235/65R17", mileage: 47100 },
  { year: 2018, make: "GMC", model: "Sierra 1500", trim: "SLE", tireSize: "265/65R17", mileage: 69300 },
  { year: 2016, make: "Mazda", model: "CX-5", trim: "Touring", tireSize: "225/55R19", mileage: 81200 },
  { year: 2021, make: "Volkswagen", model: "Tiguan", trim: "SE", tireSize: "215/65R17", mileage: 36500 },
  { year: 2013, make: "Ford", model: "Escape", trim: "SE", tireSize: "235/55R17", mileage: 142800 },
  { year: 2019, make: "Honda", model: "Accord", trim: "Sport", tireSize: "235/40R19", mileage: 49800 },
  { year: 2017, make: "Chevrolet", model: "Malibu", trim: "LT", tireSize: "225/55R17", mileage: 95400 },
  { year: 2020, make: "Ram", model: "1500", trim: "Big Horn", tireSize: "275/65R18", mileage: 52100 },
  { year: 2018, make: "Toyota", model: "Corolla", trim: "LE", tireSize: "205/55R16", mileage: 72600 },
  { year: 2015, make: "Subaru", model: "Forester", trim: "Premium", tireSize: "225/60R17", mileage: 118200 },
];

function daysFromNow(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Seeding Tires & More For Less demo database...");

  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.serviceOrderItem.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.tire.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.user.deleteMany();
  await prisma.businessSettings.deleteMany();

  await prisma.businessSettings.create({
    data: {
      id: "default",
      name: "Tires & More For Less",
      addressLine1: "1708 Central Ave NE",
      city: "Minneapolis",
      state: "MN",
      zip: "55413",
      country: "United States",
      phone: "+1 612-788-4504",
      email: "info@tiresmoreforless.demo",
      taxRate: 0.07875,
      hoursJson: JSON.stringify(HOURS),
      servicePricesJson: JSON.stringify(SERVICE_PRICES),
      notifyEmail: false,
      notifySms: false,
    },
  });

  const passwordHash = await bcrypt.hash("Demo123!", 10);
  await prisma.user.create({
    data: {
      email: "admin@tiresmoreforless.demo",
      passwordHash,
      name: "Shop Admin",
      role: "admin",
    },
  });

  const createdTires = [];
  for (const t of tires) {
    createdTires.push(
      await prisma.tire.create({
        data: {
          ...t,
          size: `${t.width}/${t.aspectRatio}R${t.diameter}`,
        },
      })
    );
  }

  const createdCustomers = [];
  for (const c of customers) {
    createdCustomers.push(
      await prisma.customer.create({
        data: {
          ...c,
          portalToken: `portal-${c.firstName.toLowerCase()}-${c.lastName.toLowerCase()}`,
        },
      })
    );
  }

  const createdVehicles = [];
  for (let i = 0; i < vehicleTemplates.length; i++) {
    const cust = createdCustomers[i % createdCustomers.length];
    const v = vehicleTemplates[i];
    createdVehicles.push(
      await prisma.vehicle.create({
        data: {
          customerId: cust.id,
          ...v,
          vin: `1HGCV1F3${String(1000000 + i).slice(1)}`,
          licensePlate: `MN-${1000 + i}`,
          notes: i === 0 ? "Primary vehicle — demo CR-V journey" : null,
        },
      })
    );
  }

  // Ensure Jordan Mitchell has the CR-V as first vehicle link for demo
  const jordan = createdCustomers.find((c) => c.lastName === "Mitchell")!;
  const crv = await prisma.vehicle.create({
    data: {
      customerId: jordan.id,
      year: 2019,
      make: "Honda",
      model: "CR-V",
      trim: "EX",
      tireSize: "225/65R17",
      mileage: 68420,
      vin: "2HKRW2H59KH123456",
      licensePlate: "MN-CRV19",
      notes: "Demo journey vehicle",
    },
  });
  createdVehicles.push(crv);

  await prisma.counter.createMany({
    data: [
      { id: "appointment", value: 100 },
      { id: "quote", value: 100 },
      { id: "serviceOrder", value: 100 },
      { id: "invoice", value: 100 },
    ],
  });

  const services = ["Tire Installation", "Tire Rotation", "Tire Balancing", "Tire Repair", "Flat Tire Repair", "Tire Inspection", "Tire Replacement"];
  const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"];
  const apptStatuses = ["Requested", "Confirmed", "Checked In", "In Service", "Completed", "Confirmed", "Completed", "Requested"];

  const appointments = [];
  for (let i = 0; i < 25; i++) {
    const cust = createdCustomers[i % createdCustomers.length];
    const veh = createdVehicles[i % createdVehicles.length];
    const dayOffset = i < 5 ? 0 : i < 10 ? -1 : i < 15 ? 1 : i - 15;
    appointments.push(
      await prisma.appointment.create({
        data: {
          number: `APT-${String(101 + i).padStart(4, "0")}`,
          customerId: cust.id,
          vehicleId: veh.id,
          serviceType: services[i % services.length],
          date: daysFromNow(dayOffset),
          time: times[i % times.length],
          status: apptStatuses[i % apptStatuses.length],
          notes: i % 4 === 0 ? "Customer prefers afternoon if possible" : null,
          tireSize: veh.tireSize,
        },
      })
    );
  }

  // Quote requests
  for (let i = 0; i < 14; i++) {
    const cust = createdCustomers[i % createdCustomers.length];
    const veh = createdVehicles[i % createdVehicles.length];
    await prisma.quoteRequest.create({
      data: {
        customerId: cust.id,
        vehicleId: veh.id,
        name: `${cust.firstName} ${cust.lastName}`,
        phone: cust.phone,
        email: cust.email,
        vehicleInfo: `${veh.year} ${veh.make} ${veh.model}`,
        tireSize: veh.tireSize,
        quantity: 4,
        preference: i % 3 === 0 ? "Used" : "New",
        preferredBrand: ["Michelin", "Goodyear", "Any", "Bridgestone"][i % 4],
        budget: ["$400-600", "$600-800", "Under $500", "Flexible"][i % 4],
        notes: i % 2 === 0 ? "Looking for all-season tires." : "Need install this week if possible.",
        status: ["New", "Reviewed", "Quoted", "New"][i % 4],
      },
    });
  }

  // Jordan Mitchell demo quote request + quote (Accepted, ready to convert or already mid-journey)
  const defender = createdTires.find((t) => t.sku === "MICH-DEF2-2256517")!;
  const jordanQr = await prisma.quoteRequest.create({
    data: {
      customerId: jordan.id,
      vehicleId: crv.id,
      name: "Jordan Mitchell",
      phone: jordan.phone,
      email: jordan.email,
      vehicleInfo: "2019 Honda CR-V",
      tireSize: "225/65R17",
      quantity: 4,
      preference: "New",
      preferredBrand: "Michelin",
      budget: "$700-800",
      notes: "I need 4 tires for my 2019 Honda CR-V.",
      status: "Quoted",
    },
  });

  const jordanQuote = await prisma.quote.create({
    data: {
      number: "QTE-0100",
      customerId: jordan.id,
      vehicleId: crv.id,
      quoteRequestId: jordanQr.id,
      status: "Accepted",
      discount: 40,
      taxRate: 0.07875,
      notes: "4x Michelin Defender2 + install + balance",
      validUntil: daysFromNow(14),
      items: {
        create: [
          { tireId: defender.id, description: "Michelin Defender2 225/65R17", quantity: 4, unitPrice: 189.99, itemType: "tire" },
          { description: "Tire Installation", quantity: 4, unitPrice: 25, itemType: "service" },
          { description: "Tire Balancing", quantity: 4, unitPrice: 20, itemType: "service" },
        ],
      },
    },
  });

  // Service orders + invoices for history
  let soNum = 101;
  let invNum = 101;
  for (let i = 0; i < 18; i++) {
    const cust = createdCustomers[i % createdCustomers.length];
    const veh = createdVehicles[i % createdVehicles.length];
    const tire = createdTires[i % createdTires.length];
    const status = i < 6 ? "Open" : i < 10 ? "In Progress" : i < 14 ? "Completed" : "Invoiced";
    const so = await prisma.serviceOrder.create({
      data: {
        number: `SO-${String(soNum++).padStart(4, "0")}`,
        customerId: cust.id,
        vehicleId: veh.id,
        appointmentId: i < 8 ? appointments[i].id : null,
        mileage: veh.mileage,
        complaint: ["Vibration on highway", "Slow leak LF", "Worn front tires", "Rotation due", "Flat tire"][i % 5],
        inspectionNotes: i % 2 === 0 ? "LF tread 4/32, RF 5/32" : "All tires within safe range",
        technicianNotes: i % 3 === 0 ? "Recommend replace front pair within 3 months" : null,
        status,
        discount: i % 5 === 0 ? 25 : 0,
        taxRate: 0.07875,
        items: {
          create: [
            ...(i % 2 === 0
              ? [{ tireId: tire.id, description: `${tire.brand} ${tire.model} ${tire.size}`, quantity: i % 3 === 0 ? 4 : 2, unitPrice: tire.price, cost: tire.cost, itemType: "tire", inventoryDeducted: status !== "Open" }]
              : []),
            { description: services[i % services.length], quantity: 1, unitPrice: Object.values(SERVICE_PRICES)[i % 5] || 25, cost: 0, itemType: "service", inventoryDeducted: false },
          ],
        },
      },
      include: { items: true },
    });

    if (status === "Invoiced" || i >= 14) {
      const invStatus = i % 3 === 0 ? "Unpaid" : i % 3 === 1 ? "Partially Paid" : "Paid";
      const subtotal = so.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
      const afterDisc = Math.max(0, subtotal - so.discount);
      const tax = Math.round(afterDisc * 0.07875 * 100) / 100;
      const total = Math.round((afterDisc + tax) * 100) / 100;
      const inv = await prisma.invoice.create({
        data: {
          number: `INV-${String(invNum++).padStart(4, "0")}`,
          customerId: cust.id,
          vehicleId: veh.id,
          serviceOrderId: so.id,
          status: invStatus,
          discount: so.discount,
          taxRate: 0.07875,
          paidAt: invStatus === "Paid" ? new Date() : null,
          items: {
            create: so.items.map((it) => ({
              tireId: it.tireId,
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              itemType: it.itemType,
            })),
          },
        },
      });
      if (invStatus === "Paid") {
        await prisma.payment.create({ data: { invoiceId: inv.id, amount: total, method: "Card" } });
      } else if (invStatus === "Partially Paid") {
        await prisma.payment.create({ data: { invoiceId: inv.id, amount: Math.round(total * 0.5 * 100) / 100, method: "Cash" } });
      }
      await prisma.serviceOrder.update({ where: { id: so.id }, data: { status: "Invoiced" } });
    }
  }

  // Extra completed invoices for revenue metrics
  for (let i = 0; i < 6; i++) {
    const cust = createdCustomers[i + 3];
    const veh = createdVehicles[i + 3];
    const tire = createdTires[i + 2];
    const so = await prisma.serviceOrder.create({
      data: {
        number: `SO-${String(soNum++).padStart(4, "0")}`,
        customerId: cust.id,
        vehicleId: veh.id,
        mileage: veh.mileage,
        complaint: "Tire replacement",
        status: "Invoiced",
        taxRate: 0.07875,
        items: {
          create: [
            { tireId: tire.id, description: `${tire.brand} ${tire.model} ${tire.size}`, quantity: 4, unitPrice: tire.price, cost: tire.cost, itemType: "tire", inventoryDeducted: true },
            { description: "Tire Installation", quantity: 4, unitPrice: 25, cost: 0, itemType: "service" },
            { description: "Tire Balancing", quantity: 4, unitPrice: 20, cost: 0, itemType: "service" },
          ],
        },
      },
      include: { items: true },
    });
    const subtotal = so.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const tax = Math.round(subtotal * 0.07875 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const inv = await prisma.invoice.create({
      data: {
        number: `INV-${String(invNum++).padStart(4, "0")}`,
        customerId: cust.id,
        vehicleId: veh.id,
        serviceOrderId: so.id,
        status: "Paid",
        taxRate: 0.07875,
        paidAt: new Date(Date.now() - i * 86400000 * 2),
        issuedAt: new Date(Date.now() - i * 86400000 * 2),
        items: {
          create: so.items.map((it) => ({
            tireId: it.tireId,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            itemType: it.itemType,
          })),
        },
      },
    });
    await prisma.payment.create({ data: { invoiceId: inv.id, amount: total, method: i % 2 ? "Card" : "Cash" } });
  }

  // Notes & communications
  for (let i = 0; i < 10; i++) {
    const cust = createdCustomers[i];
    await prisma.customerNote.create({
      data: { customerId: cust.id, content: ["Prefers text updates", "Fleet discount discussion", "Winter tire storage interest", "Repeat customer — good standing"][i % 4], createdBy: "Shop Admin" },
    });
    await prisma.communication.create({
      data: {
        customerId: cust.id,
        channel: ["phone", "email", "in-person", "sms"][i % 4],
        direction: i % 2 ? "inbound" : "outbound",
        subject: "Service follow-up",
        body: "Discussed tire options and scheduled service.",
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      { type: "Appointment Requested", title: "New appointment request", message: "APT-0101 requested for Tire Rotation.", status: "Mock", channel: "in-app" },
      { type: "Quote Ready", title: "Quote request from website", message: "Jordan Mitchell requested 4 tires for 2019 Honda CR-V.", customerId: jordan.id, status: "Mock", channel: "in-app" },
      { type: "Appointment Confirmed", title: "Appointment confirmed", message: "APT-0105 confirmed for tomorrow.", status: "Mock", channel: "in-app" },
      { type: "Invoice Created", title: "Invoice created", message: "INV-0105 ready for payment.", status: "Mock", channel: "in-app" },
      { type: "Vehicle Ready", title: "Vehicle ready", message: "SO-0112 completed — customer notified (mock).", status: "Mock", channel: "in-app" },
    ],
  });

  await prisma.counter.update({ where: { id: "appointment" }, data: { value: 125 } });
  await prisma.counter.update({ where: { id: "quote" }, data: { value: 100 } });
  await prisma.counter.update({ where: { id: "serviceOrder" }, data: { value: soNum - 1 } });
  await prisma.counter.update({ where: { id: "invoice" }, data: { value: invNum - 1 } });

  console.log("Seed complete.");
  console.log("Admin login: admin@tiresmoreforless.demo / Demo123!");
  console.log(`Demo quote ready: ${jordanQuote.number} (Accepted) for Jordan Mitchell`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
