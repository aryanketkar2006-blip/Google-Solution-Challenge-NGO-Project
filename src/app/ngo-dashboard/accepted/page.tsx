"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Clock, Briefcase } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Report, ReportStatus, ReportPriority, UserRole } from "@/models/types";

export default function NGOAcceptedDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterStatus, setFilterStatus] = useState<string>(ReportStatus.ACCEPTED);

  useEffect(() => {
    if (!authLoading && (!user || role !== UserRole.NGO)) {
      router.push("/dashboard");
      return;
    }

    if (user && role === UserRole.NGO) {
      // Security: Filter by assignedNgoId in the query
      const q = query(
        collection(db, "reports"),
        where("assignedNgoId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reportsData: Report[] = [];
        snapshot.forEach((doc) => {
          reportsData.push({ id: doc.id, ...doc.data() } as Report);
        });
        setReports(reportsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching accepted reports:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, role, authLoading, router]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      if (filterStatus !== "all" && report.status !== filterStatus) return false;
      return true;
    });
  }, [reports, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case ReportStatus.PENDING:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case ReportStatus.ACCEPTED:
        return <Badge className="bg-blue-500 hover:bg-blue-600">Accepted</Badge>;
      case ReportStatus.RESOLVED:
        return <Badge className="bg-green-500 hover:bg-green-600">Resolved</Badge>;
      case ReportStatus.WITHDRAWN:
        return <Badge variant="destructive">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case ReportPriority.HIGH:
        return <Badge variant="destructive" className="ml-2 uppercase text-[10px]">High</Badge>;
      case ReportPriority.MEDIUM:
        return <Badge variant="secondary" className="ml-2 uppercase text-[10px] bg-orange-100 text-orange-700">Medium</Badge>;
      case ReportPriority.LOW:
        return <Badge variant="secondary" className="ml-2 uppercase text-[10px] bg-blue-100 text-blue-700">Low</Badge>;
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return <div className="flex flex-1 items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="flex-1 container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" /> My Working Queue
          </h1>
          <p className="text-muted-foreground mt-1">Issues assigned to you for resolution.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Filter Status:</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assigned</SelectItem>
              <SelectItem value={ReportStatus.ACCEPTED}>Accepted</SelectItem>
              <SelectItem value={ReportStatus.RESOLVED}>Resolved</SelectItem>
              <SelectItem value={ReportStatus.WITHDRAWN}>Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <Card className="text-center py-20 border-dashed">
          <CardContent>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Briefcase className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No issues found</h3>
            <p className="text-muted-foreground mb-6">
              {filterStatus === ReportStatus.ACCEPTED 
                ? "You don't have any active issues in your queue." 
                : "No issues match your selected filter."}
            </p>
            <Link href="/ngo-dashboard">
              <Button>Explore Global Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <Card key={report.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-all border-muted h-full">
              <Link href={`/reports/${report.id}`} className="flex-1">
                {report.imageUrl && (
                  <div className="w-full h-48 bg-muted relative">
                    <Image 
                      src={report.imageUrl} 
                      alt={report.category} 
                      fill 
                      className="object-cover" 
                    />
                    <div className="absolute top-2 left-2">
                      {getPriorityBadge(report.priority)}
                    </div>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl line-clamp-1">{report.category}</CardTitle>
                      {!report.imageUrl && getPriorityBadge(report.priority)}
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {report.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="truncate">{report.location.city ? `${report.location.city}, ${report.location.state}` : `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </CardContent>
              </Link>
              <CardFooter className="bg-muted/30 pt-4 border-t mt-auto">
                <Link href={`/reports/${report.id}`} className="w-full">
                  <Button variant="outline" className="w-full">View Details & Log Activity</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
