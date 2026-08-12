export const BUSINESS_NAME = "Tires & More For Less";

export const PHONE = {
  raw: "+16127884504",
  display: "+1 (612) 788-4504",
  href: "tel:+16127884504",
};

export const ADDRESS = {
  line1: "1708 Central Ave NE",
  city: "Minneapolis",
  state: "MN",
  zip: "55413",
  country: "United States",
  full: "1708 Central Ave NE, Minneapolis, MN 55413, United States",
  short: "1708 Central Ave NE, Minneapolis, MN 55413",
};

export const MAPS = {
  directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS.full)}`,
  embed: `https://maps.google.com/maps?q=${encodeURIComponent(ADDRESS.full)}&z=15&output=embed`,
};

/** Real shop photos from 1708 Central Ave NE */
export const SHOP_IMAGES = {
  hero: "/images/exterior-front.png",
  storefront: "/images/exterior-storefront.png",
  serviceBay: "/images/exterior-bay.png",
  showroom: "/images/interior-showroom.png",
  showroomWide: "/images/interior-wide.png",
  counter: "/images/interior-counter.png",
  rims: "/images/interior-rims.png",
} as const;

export const GALLERY = [
  { src: SHOP_IMAGES.hero, alt: "Tires & More For Less storefront on Central Ave NE" },
  { src: SHOP_IMAGES.storefront, alt: "Shop exterior with TIRES & MORE signage and NAPA AutoCare" },
  { src: SHOP_IMAGES.serviceBay, alt: "Service bay with vehicle on the lift" },
  { src: SHOP_IMAGES.showroom, alt: "Tire and wheel inventory inside the showroom" },
  { src: SHOP_IMAGES.showroomWide, alt: "Showroom floor with tire stacks and rim displays" },
  { src: SHOP_IMAGES.counter, alt: "Service counter and tire inventory" },
  { src: SHOP_IMAGES.rims, alt: "Custom wheels and rims on display" },
] as const;

export const HOURS = [
  { label: "Monday – Friday", value: "9:00 AM – 6:30 PM" },
  { label: "Saturday", value: "9:00 AM – 3:00 PM" },
  { label: "Sunday", value: "Closed" },
] as const;

export const HOURS_SUMMARY = "Mon–Fri 9:00 AM – 6:30 PM · Sat 9:00 AM – 3:00 PM · Sunday Closed";

export type ServiceDef = {
  id: string;
  name: string;
  description: string;
  href?: string;
};

export const SERVICES: ServiceDef[] = [
  {
    id: "installation",
    name: "Tire Installation",
    description: "Professional mounting and installation.",
  },
  {
    id: "flat-repair",
    name: "Flat Tire Repair",
    description: "Fast inspection and repair when possible.",
  },
  {
    id: "rotation",
    name: "Tire Rotation",
    description: "Help extend tire life and maintain even wear.",
  },
  {
    id: "balancing",
    name: "Tire Balancing",
    description: "Improve ride quality and reduce vibration.",
  },
  {
    id: "inspection",
    name: "Tire Inspection",
    description: "Check tread depth, tire pressure, wear and overall condition.",
  },
  {
    id: "replacement",
    name: "Tire Replacement",
    description: "Help customers choose the correct replacement tire.",
  },
  {
    id: "same-day",
    name: "Same-Day Tire Help",
    description:
      "Priority tire help during business hours when our schedule allows. Same-day service is available while we’re open — we do not offer 24/7 emergency service.",
  },
];

export const BOOKABLE_SERVICES = [
  "Tire Installation",
  "Tire Rotation",
  "Tire Balancing",
  "Tire Repair",
  "Flat Tire Repair",
  "Tire Inspection",
  "Tire Replacement",
  "Other",
] as const;

export const QUICK_SERVICES = [
  { name: "New Tires", description: "Quality new tires at fair prices.", href: "/tires?type=New", icon: "new" as const },
  { name: "Used Tires", description: "Inspected used options that stretch your budget.", href: "/tires?type=Used", icon: "used" as const },
  { name: "Tire Repair", description: "Get back on the road with dependable repairs.", href: "/services", icon: "repair" as const },
  { name: "Tire Installation", description: "Professional mounting done right.", href: "/book?service=Tire%20Installation", icon: "install" as const },
  { name: "Tire Rotation", description: "Even wear and longer tire life.", href: "/book?service=Tire%20Rotation", icon: "rotation" as const },
  { name: "Tire Balancing", description: "Smoother ride, less vibration.", href: "/book?service=Tire%20Balancing", icon: "balance" as const },
  { name: "Flat Tire Repair", description: "Fast help when you have a flat.", href: "/book?service=Flat%20Tire%20Repair", icon: "flat" as const },
  { name: "Tire Inspection", description: "Know the condition of your tires.", href: "/book?service=Tire%20Inspection", icon: "inspect" as const },
];

export const WIDTHS = Array.from({ length: 11 }, (_, i) => 175 + i * 10);
export const ASPECTS = [40, 45, 50, 55, 60, 65, 70, 75];
export const DIAMETERS = Array.from({ length: 8 }, (_, i) => 15 + i);

export const SEASONS = ["All-Season", "Winter", "Summer", "All-Terrain"] as const;
export const TIRE_TYPES = ["New", "Used"] as const;

export const MICHAEL_REVIEW = {
  name: "Michael D.",
  service: "Tires",
  price: "Great price",
  body: `My son blew a tire on the freeway coming home from work at 4:30 pm. He called me to help rescue him because his new car had no spare tire. I told him to start calling tire dealers to find a replacement as I headed to help. He was completely blown off by 5 rude tire shops, including all the name brand dealers because it was within a couple of hours of closing time! Thankfully he found Tires & More and explained his situation. They told him not to worry get the wheel over to them and they will help, even staying a little later if needed. We received excellent custom service from beginning to end. On top of that these guys were very busy when I arrived. They definitely didn't need the added work load. They had the tire repaired within 20 min and we didn't need a tow. My family and I are very grateful for the excellent customer service we received, thank you!!`,
};

export type Tire = {
  id: string;
  brand: string;
  model: string;
  width: number;
  aspectRatio: number;
  diameter: number;
  size: string;
  season: string;
  type: string;
  loadIndex?: string | null;
  speedRating?: string | null;
  price: number;
  quantity: number;
  warranty?: string | null;
  notes?: string | null;
  sku: string;
  stockStatus: string;
};
