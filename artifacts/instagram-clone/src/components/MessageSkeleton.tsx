import { motion } from "framer-motion";
import { Skeleton } from "./Skeleton";

export function MessageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      className="flex gap-3 p-4"
    >
      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-16 w-3/4 rounded-lg" />
      </div>
    </motion.div>
  );
}
