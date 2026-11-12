import { create } from "zustand";
import { PlatformUser, UsersFilter } from "./users.types";
import { USERS_MOCK } from "./users.mock";
import { hasDeletionRequest, matchesView } from "./users.helpers";

type Result = { success: boolean; message: string };

type UsersStore = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  allUsers: PlatformUser[];
  /** Current page of the filtered list. */
  users: PlatformUser[];
  /** Total rows matching the filter (all pages). */
  total: number;
  page: number;
  limit: number;

  fetchUsers: (page?: number, limit?: number, filter?: UsersFilter, search?: string) => Promise<void>;
  suspendUser: (id: string, reason: string) => Promise<Result>;
  reactivateUser: (id: string) => Promise<Result>;
  signOutEverywhere: (id: string) => Promise<Result>;
  approveDeletion: (id: string) => Promise<Result>;
  declineDeletion: (id: string) => Promise<Result>;
};

const applyFilter = (list: PlatformUser[], filter?: UsersFilter, search?: string) => {
  const q = search?.trim().toLowerCase();
  const qDigits = q?.replace(/\D/g, "");
  return list.filter(
    (u) =>
      matchesView(u, filter?.view) &&
      (!filter?.type || u.type === filter.type) &&
      (!q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (!!qDigits && u.mobile.replace(/\D/g, "").includes(qDigits))),
  );
};

export const useUsersStore = create<UsersStore>((set, get) => {
  let lastFilter: UsersFilter | undefined;
  let lastSearch: string | undefined;

  const source = () => (get().allUsers.length ? get().allUsers : USERS_MOCK);

  // Mirrors what a paginated API returns: one page of rows plus the total.
  const commit = (allUsers: PlatformUser[], page = get().page, limit = get().limit) => {
    const filtered = applyFilter(allUsers, lastFilter, lastSearch);
    const lastPage = Math.max(1, Math.ceil(filtered.length / limit));
    const safePage = Math.min(page, lastPage);
    set({
      allUsers,
      users: filtered.slice((safePage - 1) * limit, safePage * limit),
      total: filtered.length,
      page: safePage,
      limit,
    });
  };

  const find = (id: string) => source().find((u) => u.id === id);

  const patch = (id: string, changes: Partial<PlatformUser>) =>
    commit(source().map((u) => (u.id === id ? { ...u, ...changes } : u)));

  return {
    loading: false,
    saving: false,
    error: null,
    allUsers: [],
    users: [],
    total: 0,
    page: 1,
    limit: 10,

    fetchUsers: async (page = 1, limit = 10, filter, search) => {
      lastFilter = filter;
      lastSearch = search;
      set({ loading: true, error: null });
      try {
        // TODO(api): const res = await usersApi.getUsers(page, limit, filter, search);
        commit(source(), page, limit);
        set({ loading: false });
      } catch (e: any) {
        set({ error: e?.response?.data?.message ?? "Something went wrong", loading: false });
      }
    },

    suspendUser: async (id, reason) => {
      if (!reason.trim()) return { success: false, message: "Add a reason for the suspension" };
      const user = find(id);
      if (!user) return { success: false, message: "User not found" };
      if (user.status !== "ACTIVE") return { success: false, message: "Only active users can be suspended" };
      set({ saving: true });
      // TODO(api): await usersApi.suspendUser(id, { reason });
      // Suspending also ends every session, so the user is signed out right away.
      patch(id, {
        status: "SUSPENDED",
        suspendedAt: new Date().toISOString(),
        suspendReason: reason.trim(),
        activeSessions: 0,
      });
      set({ saving: false });
      return { success: true, message: `${user.name} suspended` };
    },

    reactivateUser: async (id) => {
      const user = find(id);
      if (!user || user.status !== "SUSPENDED")
        return { success: false, message: "Only suspended users can be reactivated" };
      set({ saving: true });
      // TODO(api): await usersApi.reactivateUser(id);
      patch(id, { status: "ACTIVE", suspendedAt: null, suspendReason: null });
      set({ saving: false });
      return { success: true, message: `${user.name} reactivated` };
    },

    signOutEverywhere: async (id) => {
      const user = find(id);
      if (!user) return { success: false, message: "User not found" };
      set({ saving: true });
      // TODO(api): await usersApi.revokeSessions(id);
      patch(id, { activeSessions: 0 });
      set({ saving: false });
      return { success: true, message: `${user.name} signed out of all devices` };
    },

    approveDeletion: async (id) => {
      const user = find(id);
      if (!user || !hasDeletionRequest(user))
        return { success: false, message: "There is no pending deletion request" };
      set({ saving: true });
      // TODO(api): await usersApi.approveDeletion(id);
      // Personal data is removed server-side; order history is kept for finance records.
      patch(id, {
        status: "DELETED",
        activeSessions: 0,
        addresses: [],
        lastActiveAt: null,
      });
      set({ saving: false });
      return { success: true, message: `${user.name}'s account deleted` };
    },

    declineDeletion: async (id) => {
      const user = find(id);
      if (!user || !hasDeletionRequest(user))
        return { success: false, message: "There is no pending deletion request" };
      set({ saving: true });
      // TODO(api): await usersApi.declineDeletion(id);
      patch(id, { deletionRequestedAt: null });
      set({ saving: false });
      return { success: true, message: "Deletion request declined" };
    },
  };
});
