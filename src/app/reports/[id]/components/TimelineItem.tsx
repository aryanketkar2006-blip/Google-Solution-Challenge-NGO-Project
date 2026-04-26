"use client";

import { TimelineItemProps, TimelineItemType, UserRole } from "@/models/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, Edit2, MessageSquare, History, UserPlus, Users, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Image from "next/image";

const toDisplayName = (rawName?: string) => {
  if (!rawName) return "Unknown";
  if (!rawName.includes("@")) return rawName;
  const localPart = rawName.split("@")[0];
  return localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function TimelineItemCard({ item, onDelete, onEdit, canEditOrDelete }: Omit<TimelineItemProps, "user">) {
  // Heuristic for legacy 'AUTO' items or better granularity
  let effectiveType = item.type;
  const normalizedContent = item.content.toLowerCase();
  if (item.type === TimelineItemType.AUTO) {
    if (normalizedContent.includes("volunteer")) effectiveType = TimelineItemType.VOLUNTEER;
    else if (
      normalizedContent.includes("invite") ||
      normalizedContent.includes("invitation") ||
      normalizedContent.includes("collaboration") ||
      normalizedContent.includes("revoked")
    ) effectiveType = TimelineItemType.COLLABORATION;
    else if (normalizedContent.includes("status updated") || normalizedContent.includes("withdrawn by reporter")) effectiveType = TimelineItemType.STATUS_CHANGE;
  }

  const isUnknownAuto = item.type === TimelineItemType.AUTO && effectiveType === TimelineItemType.AUTO;
  const isSystem = item.authorRole === UserRole.SYSTEM || isUnknownAuto;
  const isAutoAction = [TimelineItemType.STATUS_CHANGE, TimelineItemType.COLLABORATION, TimelineItemType.VOLUNTEER].includes(effectiveType);
  const typeLabel = isSystem ? "SYSTEM EVENT" : effectiveType.replace("_", " ");
  const displayAuthorName = toDisplayName(item.authorName);
  const actionActorName = isSystem ? "System" : displayAuthorName;
  const actionActorRole = item.authorRole || UserRole.SYSTEM;

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Connector Line */}
      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border group-last:bg-transparent" />

      {/* Icon/Dot */}
      <div className={cn(
        "absolute left-0 top-1 h-7 w-7 rounded-full border-4 border-background flex items-center justify-center z-10",
        effectiveType === TimelineItemType.ACTIVITY ? "bg-primary text-white" :
        effectiveType === TimelineItemType.NOTE ? "bg-blue-500 text-white" :
        effectiveType === TimelineItemType.STATUS_CHANGE ? "bg-amber-500 text-white" :
        effectiveType === TimelineItemType.COLLABORATION ? "bg-purple-500 text-white" :
        effectiveType === TimelineItemType.VOLUNTEER ? "bg-emerald-500 text-white" :
        "bg-muted text-muted-foreground"
      )}>
        {effectiveType === TimelineItemType.ACTIVITY ? <History className="h-3 w-3" /> :
         effectiveType === TimelineItemType.NOTE ? <MessageSquare className="h-3 w-3" /> :
         effectiveType === TimelineItemType.STATUS_CHANGE ? <RefreshCw className="h-3 w-3" /> :
         effectiveType === TimelineItemType.COLLABORATION ? <Users className="h-3 w-3" /> :
         effectiveType === TimelineItemType.VOLUNTEER ? <UserPlus className="h-3 w-3" /> :
         <Clock className="h-3 w-3" />}
      </div>

      <Card className={cn(
        "border-l-4",
        effectiveType === TimelineItemType.ACTIVITY ? "border-l-primary" :
        effectiveType === TimelineItemType.NOTE ? "border-l-blue-500" :
        effectiveType === TimelineItemType.STATUS_CHANGE ? "border-l-amber-500" :
        effectiveType === TimelineItemType.COLLABORATION ? "border-l-purple-500" :
        effectiveType === TimelineItemType.VOLUNTEER ? "border-l-emerald-500" :
        "border-l-muted"
      )}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
               <Badge variant="outline" className={cn(
                "text-[9px] uppercase font-bold tracking-wider",
                effectiveType === TimelineItemType.STATUS_CHANGE && "text-amber-600 border-amber-200 bg-amber-50",
                effectiveType === TimelineItemType.COLLABORATION && "text-purple-600 border-purple-200 bg-purple-50",
                effectiveType === TimelineItemType.VOLUNTEER && "text-emerald-600 border-emerald-200 bg-emerald-50"
              )}>
                {typeLabel}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.createdAt ? (
                  formatDistanceToNow(
                    'toDate' in item.createdAt ? item.createdAt.toDate() : new Date(item.createdAt), 
                    { addSuffix: true }
                  )
                ) : "recently"}
              </span>
            </div>

            {!isSystem && canEditOrDelete(item) && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(item)}>
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(item.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <p className={cn(
            "text-sm mb-3 whitespace-pre-wrap", 
            isSystem ? "text-muted-foreground italic" : "text-foreground",
            isAutoAction && "font-medium"
          )}>
            {item.content}
          </p>

          {(isAutoAction || isSystem) && (
            <div className="flex flex-wrap gap-4 items-center mt-3 pt-2 border-t border-dashed">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
                <span>Action by: <span className="font-semibold text-foreground not-italic">{actionActorName}</span> ({actionActorRole})</span>
              </div>
            </div>
          )}

          {!isSystem && (
            <div className="flex flex-wrap gap-4 items-center mt-4 pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  {displayAuthorName[0]}
                </div>
                <div>
                  <span className="font-medium text-foreground block">{displayAuthorName}</span>
                  <span className="uppercase text-[9px] tracking-tight">{item.authorRole}</span>
                </div>
              </div>
            </div>
          )}

          {item.imageUrls && item.imageUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {item.imageUrls.map((url, i) => (
                <div key={i} className="relative h-32 w-full rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(url, "_blank")}>
                  <Image
                    src={url}
                    alt="Activity"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
