"use client";

import { IssueHeaderProps, ReportStatus, ReportPriority } from "@/models/types";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

export function IssueHeader({ report }: IssueHeaderProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case ReportStatus.PENDING:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
      case ReportStatus.ACCEPTED:
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>;
      case ReportStatus.RESOLVED:
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Resolved</Badge>;
      case ReportStatus.WITHDRAWN:
        return <Badge variant="destructive">Withdrawn</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <Badge variant="destructive" className="ml-2 uppercase text-[10px]">Urgent</Badge>;
      case ReportPriority.HIGH:
        return <Badge variant="secondary" className="ml-2 uppercase text-[10px] bg-orange-100 text-orange-700">High</Badge>;
      case ReportPriority.MEDIUM:
        return <Badge variant="secondary" className="ml-2 uppercase text-[10px] bg-blue-100 text-blue-700">Medium</Badge>;
      case ReportPriority.LOW:
        return <Badge variant="secondary" className="ml-2 uppercase text-[10px] bg-gray-100 text-gray-700">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-2xl">{report.category}</CardTitle>
            {getPriorityBadge(report.priority)}
          </div>
          <CardDescription className="flex items-center gap-4 text-sm mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {report.location.city ? `${report.location.city}, ${report.location.state}` : `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {format(new Date(report.createdAt), "PPP")}
            </span>
          </CardDescription>
        </div>
        {getStatusBadge(report.status)}
      </div>
    </CardHeader>
  );
}
