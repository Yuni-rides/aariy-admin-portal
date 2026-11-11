import { Card } from "@/components/ui/Card";

const SkeletonLine = ({ width = "w-full" }: { width?: string }) => (
  <div className={`h-4 bg-gray-200 rounded animate-pulse ${width}`} />
);

const CardSkeleton = () => {
  return (
    <Card className="p-6 relative">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-1/3" />
          <SkeletonLine width="w-1/4" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonLine width="w-24" />
            <SkeletonLine />
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CardSkeleton;
