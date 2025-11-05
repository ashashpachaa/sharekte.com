import React from "react";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";

interface StatusChange {
  id: string;
  fromStatus: string;
  toStatus: string;
  changedDate: string;
  changedBy: string;
  reason?: string;
  notes?: string;
}

interface StatusHistoryTimelineProps {
  statusHistory?: StatusChange[];
  compact?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  "under-review": "bg-blue-50 border-blue-200",
  "amend-required": "bg-orange-50 border-orange-200",
  "confirm-application": "bg-purple-50 border-purple-200",
  transferring: "bg-cyan-50 border-cyan-200",
  "complete-transfer": "bg-green-50 border-green-200",
  canceled: "bg-red-50 border-red-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "amend-required": <AlertCircle className="w-4 h-4 text-orange-600" />,
  "complete-transfer": <CheckCircle className="w-4 h-4 text-green-600" />,
};

export function StatusHistoryTimeline({
  statusHistory = [],
  compact = false,
}: StatusHistoryTimelineProps) {
  if (!statusHistory || statusHistory.length === 0) {
    return null;
  }

  // Sort by date, newest first
  const sortedHistory = [...statusHistory].sort(
    (a, b) =>
      new Date(b.changedDate).getTime() - new Date(a.changedDate).getTime(),
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Status History
      </h3>

      <div className="space-y-3">
        {sortedHistory.map((change, index) => {
          const colorClass = STATUS_COLORS[change.toStatus] || "bg-gray-50";
          const icon = STATUS_ICONS[change.toStatus];
          const changeDate = new Date(change.changedDate);
          const formattedDate = changeDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const formattedTime = changeDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          return (
            <div
              key={change.id}
              className={`border-l-4 p-3 rounded ${colorClass} ${
                compact ? "text-sm" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1">
                  {icon && <span>{icon}</span>}
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {change.fromStatus} → {change.toStatus}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formattedDate}, {formattedTime}
                    </div>
                    {change.changedBy && (
                      <div className="text-xs text-muted-foreground">
                        By: {change.changedBy}
                      </div>
                    )}
                  </div>
                </div>
                {index === 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Latest
                  </span>
                )}
              </div>

              {change.reason && (
                <div className="mt-2 text-sm text-foreground bg-white/50 p-2 rounded">
                  <span className="font-medium">Reason:</span> {change.reason}
                </div>
              )}

              {change.notes && (
                <div className="mt-2 text-sm text-foreground bg-white/50 p-2 rounded">
                  <span className="font-medium">Notes:</span> {change.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
