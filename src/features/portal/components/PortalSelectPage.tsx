
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortalStore } from "../portal.store";
import { SERVICE_UI_CONFIG } from "../portal.config";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Loader from "@/components/ui/Loader";

export default function PortalSelectPage() {
  const router = useRouter();
  const { services, fetchServices, loading, error } = usePortalStore();

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  if (loading) {
    return <Loader fullscreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          ✨ Choose a Service to Manage
        </h1>
        <p className="text-muted-foreground">
          Select a portal to continue. Additional services are coming soon.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6 max-w-5xl w-full">
        {services.map((service) => {
          const ui = SERVICE_UI_CONFIG[service.code];

          if (!ui) return null;

          const Icon = ui.icon;

          return (
            <Card
              key={service.id}
              className="relative border-0 shadow-lg hover:shadow-xl transition-shadow h-full w-full md:w-[320px] flex-grow-0"
            >
              <Badge
                className={`absolute top-4 left-4 ${ui.statusColor} border-0 px-3 py-1 font-normal`}
              >
                {ui.status}
              </Badge>

              <CardContent className="pt-16 pb-8 px-8 flex flex-col items-center text-center h-full">
                <div
                  className={`w-16 h-16 rounded-2xl ${ui.bg} ${ui.color} flex items-center justify-center mb-6`}
                >
                  <Icon className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {service.name}
                </h3>

                <p className="text-muted-foreground text-sm mb-8 flex-1">
                  {service.description}
                </p>

                <Button
                  className={`w-full rounded-full ${ui.btn} text-white cursor-pointer`}
                  onClick={() => router.push(ui.route)}
                >
                  Enter
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
