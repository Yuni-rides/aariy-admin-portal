// TEMPORARY: mock data until the sellers API is ready.
// Delete this file once sellers.api.ts is wired into the store.
import { Seller, KybDocument, KybDocumentStatus } from "./sellers.types";
import { REQUIRED_KYB_DOCUMENTS } from "./sellers.helpers";

const docs = (
  sellerId: string,
  overrides: Partial<Record<(typeof REQUIRED_KYB_DOCUMENTS)[number], KybDocumentStatus>> = {},
): KybDocument[] =>
  REQUIRED_KYB_DOCUMENTS.map((type) => ({
    id: `${sellerId}-${type}`,
    type,
    status: overrides[type] ?? "UPLOADED",
  }));

export const SELLERS_MOCK: Seller[] = [
  {
    id: "maria-b",
    name: "Maria B",
    legalName: "[Legal name]",
    contactEmail: "partners@mariab.example",
    contactPhone: "+92 300 0000001",
    idNumber: "35202-0000000-1",
    ntnNumber: "1234567-1",
    productCount: 48,
    tier: "STANDARD",
    status: "APPROVED",
    documents: docs("maria-b"),
    createdAt: "2026-08-02T09:00:00Z",
  },
  {
    id: "noor-jahan",
    name: "Noor Jahan",
    legalName: "[Legal name]",
    contactEmail: "hello@noorjahan.example",
    contactPhone: "+92 300 0000002",
    idNumber: "42101-0000000-2",
    ntnNumber: "2345678-2",
    productCount: 31,
    tier: "STANDARD",
    status: "KYB_PENDING",
    documents: [
      ...docs("noor-jahan"),
      {
        id: "noor-jahan-other-1",
        type: "OTHER",
        status: "UPLOADED",
        title: "Trademark certificate",
      },
    ],
    createdAt: "2026-11-03T12:30:00Z",
  },
  {
    id: "monanza",
    name: "Monanza",
    legalName: "[Legal name]",
    contactEmail: "ops@monanza.example",
    contactPhone: "+92 300 0000003",
    idNumber: "61101-0000000-3",
    ntnNumber: "3456789-3",
    productCount: 0,
    tier: "STANDARD",
    status: "CHANGES_REQUESTED",
    documents: docs("monanza", {
      SALES_TAX_CERTIFICATE: "MISSING",
      BRAND_AUTHORIZATION: "REJECTED",
    }),
    reviewNote: "Sales tax certificate missing; brand authorization letter unsigned.",
    createdAt: "2026-10-21T15:10:00Z",
  },
  {
    id: "j-dot",
    name: "J.",
    legalName: "[Legal name]",
    contactEmail: "vendors@j.example",
    contactPhone: "+92 300 0000004",
    idNumber: "35201-0000000-4",
    ntnNumber: "4567890-4",
    productCount: 22,
    tier: "STANDARD",
    status: "SUSPENDED",
    documents: docs("j-dot"),
    reviewNote: "Suspended pending dispute review.",
    createdAt: "2026-06-14T08:45:00Z",
  },
];
