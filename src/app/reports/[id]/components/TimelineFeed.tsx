"use client";

import { useMemo, useState } from "react";
import { TimelineFeedProps } from "@/models/types";
import { TimelineItemCard } from "./TimelineItem";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TimelineFeed({ timeline, onDelete, onEdit, canEditOrDelete, loading }: TimelineFeedProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "activity" | "note" | "system">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTimeline = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return timeline.filter((item) => {
      const matchesType =
        activeFilter === "all" ||
        (activeFilter === "activity" && item.type === "ACTIVITY") ||
        (activeFilter === "note" && item.type === "NOTE") ||
        (activeFilter === "system" && item.type !== "ACTIVITY" && item.type !== "NOTE");

      if (!matchesType) return false;
      if (!normalizedQuery) return true;

      return (
        item.content.toLowerCase().includes(normalizedQuery) ||
        item.authorName?.toLowerCase().includes(normalizedQuery) ||
        item.type.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [timeline, activeFilter, searchQuery]);

  const counts = useMemo(() => {
    const activity = timeline.filter((item) => item.type === "ACTIVITY").length;
    const note = timeline.filter((item) => item.type === "NOTE").length;
    const system = timeline.filter((item) => item.type !== "ACTIVITY" && item.type !== "NOTE").length;
    return { all: timeline.length, activity, note, system };
  }, [timeline]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
        <p className="text-muted-foreground">No updates logged yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-5 space-y-3 rounded-xl border bg-muted/20 p-3">
        <Input
          placeholder="Search timeline by text, author, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-background"
        />
        <div className="flex flex-wrap gap-2">
          <Button variant={activeFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("all")}>
            All ({counts.all})
          </Button>
          <Button variant={activeFilter === "activity" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("activity")}>
            Activities ({counts.activity})
          </Button>
          <Button variant={activeFilter === "note" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("note")}>
            Notes ({counts.note})
          </Button>
          <Button variant={activeFilter === "system" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("system")}>
            System ({counts.system})
          </Button>
        </div>
      </div>

      {filteredTimeline.length === 0 ? (
        <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
          <p className="text-sm text-muted-foreground">No timeline entries match this filter.</p>
        </div>
      ) : filteredTimeline.map((item) => (
        <TimelineItemCard 
          key={item.id} 
          item={item} 
          onDelete={onDelete}                 
          onEdit={onEdit} 
          canEditOrDelete={canEditOrDelete} 
        />
      ))}
    </div>
  );
}
