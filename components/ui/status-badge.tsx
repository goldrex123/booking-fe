import { Badge } from "@/components/ui/badge";
import type { ReservationStatus } from "@/types/reservation";

export function StatusBadge({ status }: { status: ReservationStatus }) {
  if (status === "CONFIRMED") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
        예약 완료
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      취소됨
    </Badge>
  );
}
