"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "../settings.store";
import { SettingsTab } from "../settings.types";
import { SETTINGS_TABS } from "../settings.helpers";
import { useProductsStore } from "@/features/products/products.store";
import { useSellersStore } from "@/features/sellers/sellers.store";
import { HomeBannerTab } from "./HomeBannerTab";
import { PagesTab } from "./PagesTab";
import { PoliciesForm } from "./PoliciesForm";
import { StoreInfoForm } from "./StoreInfoForm";

type Result = { success: boolean; message: string };

export default function SettingsPage() {
  const {
    loading,
    saving,
    error,
    storeInfo,
    policies,
    stamps,
    pages,
    fetchSettings,
    saveStoreInfo,
    savePolicies,
    savePage,
    unpublishPage,
    deletePage,
    homeBanner,
    saveHomeBanner,
  } = useSettingsStore();
  const { allSellers, fetchSellers } = useSellersStore();
  const { allProducts, fetchProducts } = useProductsStore();
  const [tab, setTab] = useState<SettingsTab>("PAGES");

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // The banner tab needs brands and their products.
  useEffect(() => {
    if (tab !== "HOME_BANNER") return;
    fetchSellers();
    if (!allProducts.length) fetchProducts();
  }, [tab, fetchSellers, fetchProducts, allProducts.length]);

  const notify = <T extends Result>(res: T) => {
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Couldn't save", description: res.message },
    );
    return res;
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-[13px] text-muted-foreground">Storefront pages</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Settings sections">
        {SETTINGS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "min-h-11 cursor-pointer rounded-[10px] border px-3.5 text-sm font-medium",
              tab === t.value
                ? "border-foreground bg-foreground text-white"
                : "border-input bg-white hover:bg-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <Card className="border-destructive/30 p-4 text-sm text-destructive shadow-none">{error}</Card>
      ) : loading || !storeInfo || !policies || !homeBanner ? (
        <Card className="flex flex-col gap-3 rounded-2xl p-[18px] shadow-none">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      ) : tab === "STORE_INFO" ? (
        <StoreInfoForm
          storeInfo={storeInfo}
          stamp={stamps?.storeInfo}
          saving={saving}
          onSave={async (info) => notify(await saveStoreInfo(info))}
        />
      ) : tab === "POLICIES" ? (
        <PoliciesForm
          policies={policies}
          stamp={stamps?.policies}
          saving={saving}
          onSave={async (p) => notify(await savePolicies(p))}
        />
      ) : tab === "HOME_BANNER" ? (
        <HomeBannerTab
          banner={homeBanner}
          stamp={stamps?.homeBanner}
          sellers={allSellers}
          products={allProducts}
          saving={saving}
          onSave={async (b) => notify(await saveHomeBanner(b))}
        />
      ) : (
        <PagesTab
          pages={pages}
          saving={saving}
          onSave={async (dto, publish, id) => notify(await savePage(dto, publish, id))}
          onUnpublish={async (id) => notify(await unpublishPage(id))}
          onDelete={async (id) => notify(await deletePage(id))}
        />
      )}
    </div>
  );
}
