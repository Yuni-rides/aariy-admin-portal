import { Truck, Package } from "lucide-react";

export const SERVICE_UI_CONFIG: Record<
  string,
  {
    icon: any;
    color: string;
    bg: string;
    btn: string;
    status: string;
    statusColor: string;
    route: string;
  }
> = {
  NEMT: {
    icon: Truck,
    color: "text-green-600",
    bg: "bg-green-100",
    btn: "bg-green-600 hover:bg-green-700",
    status: "Available",
    statusColor: "bg-green-100 text-green-700",
    route: "/nemt",
  },
  DELIVERIES: {
    icon: Package,
    color: "text-secondary",
    bg: "bg-purple-100",
    btn: "bg-secondary hover:bg-secondary/90",
    status: "Available",
    statusColor: "bg-purple-100 text-secondary",
    route: "/deliveries",
  },
};
