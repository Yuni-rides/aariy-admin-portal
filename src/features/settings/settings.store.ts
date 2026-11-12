import { create } from "zustand";
import { useAuthStore } from "@/features/auth/auth.store";
import { EditStamp, HomeBanner, Policies, SavePageDto, StoreInfo, StorefrontPage } from "./settings.types";
import { HOME_BANNER_MOCK, PAGES_MOCK, POLICIES_MOCK, STAMPS_MOCK, STORE_INFO_MOCK } from "./settings.mock";
import {
  validateBanner,
  MAX_CONFIRMATION_TIMEOUT_HOURS,
  MAX_RETURN_WINDOW_DAYS,
  SLUG_PATTERN,
  validateStoreInfo,
} from "./settings.helpers";

type Result = { success: boolean; message: string };

type SettingsStore = {
  loaded: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  storeInfo: StoreInfo | null;
  policies: Policies | null;
  stamps: Record<"storeInfo" | "policies" | "homeBanner", EditStamp> | null;
  pages: StorefrontPage[];
  homeBanner: HomeBanner | null;

  fetchSettings: () => Promise<void>;
  saveStoreInfo: (info: StoreInfo) => Promise<Result>;
  savePolicies: (policies: Policies) => Promise<Result>;
  /** Without `id` a new page is created. `publish` false keeps it as a draft. */
  savePage: (dto: SavePageDto, publish: boolean, id?: string) => Promise<Result & { id?: string }>;
  unpublishPage: (id: string) => Promise<Result>;
  deletePage: (id: string) => Promise<Result>;
  saveHomeBanner: (banner: HomeBanner) => Promise<Result>;
};

const actorName = () => {
  const user = useAuthStore.getState().user;
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Super admin";
};

const stamp = (): EditStamp => ({ updatedBy: actorName(), updatedAt: new Date().toISOString() });

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  loaded: false,
  loading: false,
  saving: false,
  error: null,
  storeInfo: null,
  policies: null,
  stamps: null,
  pages: [],
  homeBanner: null,

  fetchSettings: async () => {
    if (get().loaded) return;
    set({ loading: true, error: null });
    try {
      // TODO(api): const res = await settingsApi.getSettings();
      set({
        storeInfo: STORE_INFO_MOCK,
        policies: POLICIES_MOCK,
        stamps: STAMPS_MOCK,
        pages: PAGES_MOCK,
        homeBanner: HOME_BANNER_MOCK,
        loaded: true,
        loading: false,
      });
    } catch (e: any) {
      set({ error: e?.response?.data?.message ?? "Something went wrong", loading: false });
    }
  },

  saveStoreInfo: async (info) => {
    if (Object.keys(validateStoreInfo(info)).length)
      return { success: false, message: "Check the highlighted fields" };
    set({ saving: true });
    // TODO(api): await settingsApi.updateStoreInfo(info);
    set((s) => ({ storeInfo: info, stamps: { ...s.stamps!, storeInfo: stamp() }, saving: false }));
    return { success: true, message: "Store info saved" };
  },

  savePolicies: async (policies) => {
    if (
      policies.returnWindowDays < 0 ||
      policies.returnWindowDays > MAX_RETURN_WINDOW_DAYS ||
      policies.confirmationTimeoutHours < 1 ||
      policies.confirmationTimeoutHours > MAX_CONFIRMATION_TIMEOUT_HOURS
    )
      return { success: false, message: "Check the highlighted fields" };
    set({ saving: true });
    // TODO(api): await settingsApi.updatePolicies(policies);
    set((s) => ({ policies, stamps: { ...s.stamps!, policies: stamp() }, saving: false }));
    return { success: true, message: "Policies saved. They apply from now on." };
  },

  savePage: async (dto, publish, id) => {
    const pages = get().pages;
    const slug = dto.slug.trim();
    if (!dto.title.trim()) return { success: false, message: "Page title is required" };
    if (!SLUG_PATTERN.test(slug))
      return { success: false, message: "Use lowercase letters, numbers and dashes in the URL slug" };
    if (pages.some((p) => p.slug === slug && p.id !== id))
      return { success: false, message: `/${slug} is already used by another page` };
    if (publish && !dto.content.trim())
      return { success: false, message: "Add content before publishing" };

    set({ saving: true });
    // TODO(api): id ? await settingsApi.updatePage(id, { ...dto, publish }) : await settingsApi.createPage(...)
    const s = stamp();
    const fields = {
      ...dto,
      title: dto.title.trim(),
      slug,
      updatedBy: s.updatedBy,
      updatedAt: s.updatedAt,
    };
    let pageId = id;
    if (id) {
      set({
        pages: pages.map((p) =>
          p.id === id
            ? {
                ...p,
                ...fields,
                // Saving a draft of a live page keeps it live until unpublished.
                status: publish ? "PUBLISHED" : p.status,
                publishedAt: publish ? s.updatedAt : p.publishedAt,
              }
            : p,
        ),
      });
    } else {
      pageId = `page-${Date.now()}`;
      set({
        pages: [
          ...pages,
          {
            id: pageId,
            ...fields,
            status: publish ? "PUBLISHED" : "DRAFT",
            isSystem: false,
            publishedAt: publish ? s.updatedAt : null,
          },
        ],
      });
    }
    set({ saving: false });
    return { success: true, message: publish ? `Published at /${slug}` : "Draft saved", id: pageId };
  },

  unpublishPage: async (id) => {
    const page = get().pages.find((p) => p.id === id);
    if (!page || page.status !== "PUBLISHED") return { success: false, message: "Page isn't published" };
    set({ saving: true });
    // TODO(api): await settingsApi.unpublishPage(id);
    const s = stamp();
    set({
      pages: get().pages.map((p) => (p.id === id ? { ...p, status: "DRAFT", ...s } : p)),
      saving: false,
    });
    return { success: true, message: `${page.title} is no longer on the storefront` };
  },

  deletePage: async (id) => {
    const page = get().pages.find((p) => p.id === id);
    if (!page) return { success: false, message: "Page not found" };
    if (page.isSystem) return { success: false, message: "Policy and contact pages can't be deleted" };
    set({ saving: true });
    // TODO(api): await settingsApi.deletePage(id);
    set({ pages: get().pages.filter((p) => p.id !== id), saving: false });
    return { success: true, message: `${page.title} deleted` };
  },

  saveHomeBanner: async (banner) => {
    if (Object.keys(validateBanner(banner)).length)
      return { success: false, message: "Check the highlighted fields" };
    set({ saving: true });
    // TODO(api): await settingsApi.updateHomeBanner(banner);
    set((s) => ({ homeBanner: banner, stamps: { ...s.stamps!, homeBanner: stamp() }, saving: false }));
    return { success: true, message: "Home banner saved. It updates on the storefront right away." };
  },
}));
