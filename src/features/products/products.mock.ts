// TEMPORARY: mock data until the products API is ready.
// Delete this file once products.api.ts is wired into the store.
import { Product, ProductVariant, SizeChartRow } from "./products.types";

const variants = (prefix: string, price: number, colour: string): ProductVariant[] =>
  ["S", "M", "L"].map((size, i) => ({
    id: `${prefix}-${size}`,
    size,
    colour,
    sku: `${prefix}-${size}`,
    barcode: `896123450${String(i + 1).padStart(4, "0")}`,
    price,
    stock: [4, 1, 6][i],
  }));

const SIZE_CHART: SizeChartRow[] = [
  { size: "S", chest: "92", length: "112" },
  { size: "M", chest: "97", length: "114" },
  { size: "L", chest: "102", length: "116" },
];

export const PRODUCTS_MOCK: Product[] = [
  {
    id: "p-1",
    name: "Embroidered lawn 3pc",
    sellerId: "maria-b",
    sellerName: "Maria B",
    categoryId: "kurta-set",
    categoryName: "Kurta set",
    description: "Three-piece lawn suit with embroidered neckline.",
    material: "Lawn",
    dispatchLeadTimeDays: 2,
    variants: variants("MB-L3", 5000, "Teal"),
    images: ["", "", "", ""],
    sizeChart: SIZE_CHART,
    addedBy: "SELLER",
    status: "SUBMITTED",
    createdAt: "2026-11-09T11:00:00Z",
  },
  {
    id: "p-2",
    name: "Chiffon maxi",
    sellerId: "noor-jahan",
    sellerName: "Noor Jahan",
    categoryId: "maxi",
    categoryName: "Maxi",
    description: "Flowing chiffon maxi with lining.",
    material: "Chiffon",
    dispatchLeadTimeDays: 3,
    variants: variants("NJ-CM", 5700, "Blush"),
    images: ["", ""],
    sizeChart: SIZE_CHART,
    addedBy: "SELLER",
    status: "SUBMITTED",
    createdAt: "2026-11-08T16:20:00Z",
  },
  {
    id: "p-3",
    name: "Printed pishwas",
    sellerId: "j-dot",
    sellerName: "J.",
    categoryId: "pishwas",
    categoryName: "Pishwas",
    description: "Printed pishwas with gota detailing.",
    material: "Cotton",
    dispatchLeadTimeDays: 2,
    variants: variants("J-PP", 4200, "Mustard"),
    images: ["", "", ""],
    sizeChart: [],
    addedBy: "STAFF",
    status: "APPROVED",
    createdAt: "2026-10-30T10:00:00Z",
  },
  {
    id: "p-4",
    name: "Cotton sharara",
    sellerId: "monanza",
    sellerName: "Monanza",
    categoryId: "sharara",
    categoryName: "Sharara",
    description: "Two-piece cotton sharara set.",
    material: "Cotton",
    dispatchLeadTimeDays: 4,
    variants: variants("MZ-CS", 3900, "White"),
    images: [""],
    sizeChart: [],
    addedBy: "SELLER",
    status: "REJECTED",
    rejectionReason: "Images are low resolution; size chart missing.",
    createdAt: "2026-10-25T09:30:00Z",
  },
];

// Extra generated rows so pagination has something to page through.
const EXTRA_NAMES = [
  "Khaddar kurta", "Silk dupatta set", "Linen co-ord", "Velvet shawl suit",
  "Cambric shirt", "Organza kurta set", "Jacquard maxi", "Printed lawn 2pc",
  "Chikankari kurta", "Block print sharara", "Raw silk pishwas", "Net maxi",
  "Embroidered khaddar 3pc", "Cotton net kurta", "Grip silk co-ord", "Lawn maxi",
  "Mirror work pishwas", "Crinkle chiffon set", "Karandi suit", "Viscose kurta",
];
const SELLERS = [
  ["maria-b", "Maria B", "MB"],
  ["noor-jahan", "Noor Jahan", "NJ"],
  ["j-dot", "J.", "J"],
  ["monanza", "Monanza", "MZ"],
] as const;
const CATS = [
  ["kurta-set", "Kurta set"],
  ["maxi", "Maxi"],
  ["pishwas", "Pishwas"],
  ["sharara", "Sharara"],
] as const;
const STATUSES = ["SUBMITTED", "APPROVED", "SUBMITTED", "REJECTED", "APPROVED"] as const;

PRODUCTS_MOCK.push(
  ...EXTRA_NAMES.map((name, i): Product => {
    const [sellerId, sellerName, code] = SELLERS[i % SELLERS.length];
    const [categoryId, categoryName] = CATS[i % CATS.length];
    const status = STATUSES[i % STATUSES.length];
    return {
      id: `p-x${i + 1}`,
      name,
      sellerId,
      sellerName,
      categoryId,
      categoryName,
      description: `${name}.`,
      material: "Cotton",
      dispatchLeadTimeDays: 2 + (i % 4),
      variants: variants(`${code}-X${i + 1}`, 3500 + (i % 7) * 400, "Assorted"),
      images: ["", ""],
      sizeChart: i % 2 ? SIZE_CHART : [],
      addedBy: i % 6 === 0 ? "STAFF" : "SELLER",
      status,
      rejectionReason: status === "REJECTED" ? "Images do not match the product title." : null,
      createdAt: new Date(Date.UTC(2026, 9, 28 - i)).toISOString(),
    };
  }),
);
