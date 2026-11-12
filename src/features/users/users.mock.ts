// TEMPORARY: mock data until the users API is ready.
// Delete this file once users.api.ts is wired into the store.
import { PlatformUser, UserAddress } from "./users.types";

const FIRST = ["Ayesha", "Bilal", "Hira", "Usman", "Zainab", "Hamza", "Mahnoor", "Ali", "Sana", "Fahad", "Iqra", "Saad", "Noor", "Omar"];
const LAST = ["Khan", "Ahmed", "Malik", "Raza", "Qureshi", "Sheikh", "Butt", "Iqbal"];
const CITIES: [string, string][] = [
  ["Lahore", "Punjab"],
  ["Karachi", "Sindh"],
  ["Islamabad", "ICT"],
  ["Faisalabad", "Punjab"],
  ["Peshawar", "Khyber Pakhtunkhwa"],
];
const SELLERS: [string, string][] = [
  ["maria-b", "Maria B"],
  ["noor-jahan", "Noor Jahan"],
  ["j-dot", "J."],
  ["monanza", "Monanza"],
];

const day = (daysAgo: number, hour = 11) => {
  const d = new Date("2026-11-11T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour);
  return d.toISOString();
};

const address = (id: string, i: number, isDefault: boolean): UserAddress => {
  const [city, province] = CITIES[i % CITIES.length];
  return {
    id,
    line1: `House ${10 + i}, Street ${1 + (i % 9)}`,
    city,
    province,
    postalCode: String(54000 + i * 7),
    phone: `+92 300 00${String(1000 + i).slice(-4)}`,
    isDefault,
  };
};

export const USERS_MOCK: PlatformUser[] = Array.from({ length: 32 }, (_, i) => {
  const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`;
  const id = `user-${i + 1}`;
  const isSeller = i % 7 === 3;
  const seller = SELLERS[i % SELLERS.length];
  const suspended = i === 5 || i === 18;
  const deleted = i === 12;
  const deletionRequested = i === 8 || i === 23;
  const orders = isSeller || deleted ? 0 : (i * 5) % 17;

  return {
    id,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}${i}@mail.example`,
    mobile: `+92 3${String(10 + (i % 40)).padStart(2, "0")} ${String(1000000 + i * 7919).slice(-7)}`,
    type: isSeller ? "SELLER" : "BUYER",
    status: deleted ? "DELETED" : suspended ? "SUSPENDED" : "ACTIVE",
    market: "PK",
    locale: i % 4 === 0 ? "ur-PK" : "en-PK",
    ordersCount: orders,
    totalSpent: orders * (3200 + (i % 6) * 750),
    lastOrderAt: orders ? day(i % 20, 14) : null,
    lastActiveAt: deleted ? null : day(i % 9, 9 + (i % 10)),
    activeSessions: deleted || suspended ? 0 : 1 + (i % 3),
    addresses: isSeller || deleted
      ? []
      : [address(`${id}-a1`, i, true), ...(i % 3 === 0 ? [address(`${id}-a2`, i + 2, false)] : [])],
    ...(isSeller ? { sellerId: seller[0], sellerName: seller[1] } : {}),
    suspendedAt: suspended ? day(3 + i) : null,
    suspendReason: suspended
      ? i === 5
        ? "Repeated cash-on-delivery refusals."
        : "Abusive messages to seller support."
      : null,
    deletionRequestedAt: deletionRequested ? day(i % 5) : null,
    createdAt: day(30 + i * 9),
  };
});
