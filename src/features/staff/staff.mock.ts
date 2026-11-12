// TEMPORARY: mock data until the staff API is ready.
// Delete this file once staff.api.ts is wired into the store.
import { StaffMember } from "./staff.types";

export const STAFF_MOCK: StaffMember[] = [
  {
    id: "staff-owner",
    name: "Test Admin",
    email: "owner@aariy.example",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    lastLoginAt: null,
    invitedAt: "2026-06-01T09:00:00Z",
  },
  {
    id: "staff-csr",
    name: "Rabia Iqbal",
    email: "csr@aariy.example",
    role: "CSR",
    status: "ACTIVE",
    lastLoginAt: "2026-11-06T01:12:00Z",
    invitedBy: "Test Admin",
    invitedAt: "2026-09-12T09:00:00Z",
  },
  {
    id: "staff-fin",
    name: "Sara Malik",
    email: "fin@aariy.example",
    role: "FINANCE",
    status: "PENDING",
    lastLoginAt: null,
    invitedBy: "Test Admin",
    invitedAt: "2026-11-03T10:00:00Z",
    // Already expired, so the row offers a new setup link.
    linkExpiresAt: "2026-11-05T10:00:00Z",
  },
  {
    id: "staff-ops",
    name: "Hamza Raza",
    email: "ops@aariy.example",
    role: "OPERATIONS",
    status: "ACTIVE",
    lastLoginAt: "2026-11-11T05:40:00Z",
    invitedBy: "Test Admin",
    invitedAt: "2026-08-20T09:00:00Z",
  },
  {
    id: "staff-support",
    name: "Iqra Sheikh",
    email: "support@aariy.example",
    role: "SUPPORT",
    status: "DEACTIVATED",
    lastLoginAt: "2026-10-02T08:00:00Z",
    invitedBy: "Test Admin",
    invitedAt: "2026-07-15T09:00:00Z",
  },
];
