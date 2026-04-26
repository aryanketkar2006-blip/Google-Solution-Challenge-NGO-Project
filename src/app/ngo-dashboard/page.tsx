"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Clock, CheckCircle, CheckCircle2, X, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import { 
  Report, 
  ReportStatus, 
  ReportPriority, 
  UserRole, 
  CollaborationStatus
} from "@/models/types";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    0.5 - Math.cos(dLat)/2 + 
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    (1 - Math.cos(dLon))/2;

  return R * 2 * Math.asin(Math.sqrt(a));
}

export default function NGODashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [ngoLocation, setNgoLocation] = useState<{lat: number, lng: number} | null>(null);

  // Filter states
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>(ReportStatus.PENDING); // Default open
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterNearMe, setFilterNearMe] = useState<boolean>(false);
  const [filterRadius, setFilterRadius] = useState<number>(5); // Default 5km
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  useEffect(() => {
    if (!authLoading && (!user || role !== UserRole.NGO)) {
      router.push("/dashboard");
      return;
    }

    if (user && role === UserRole.NGO) {
      const q = query(
        collection(db, "reports"),
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
        console.error("Error fetching reports:", error);
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user, role, authLoading, router]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Basic Role/Assignment Logic
      const isVisible = report.status === ReportStatus.PENDING || (report.assignedNgoId === user?.uid);
      if (!isVisible) return false;

      // Category Filter
      if (filterCategory !== "all" && report.category !== filterCategory) return false;

      // Status Filter
      if (filterStatus !== "all" && report.status !== filterStatus) return false;

      // Priority Filter
      if (filterPriority !== "all" && report.priority !== filterPriority) return false;

      // City/Area Search
      if (filterCity && !report.location.city?.toLowerCase().includes(filterCity.toLowerCase())) return false;

      // Near Me Filter
      if (filterNearMe && ngoLocation) {
        const distance = calculateDistance(
          ngoLocation.lat, ngoLocation.lng,
          report.location.lat, report.location.lng
        );
        // Include reports within the selected radius (inclusive of 0 distance)
        if (distance > filterRadius) return false;
      }

      // Date Range Filter
      const reportDate = new Date(report.createdAt);
      if (filterStartDate && reportDate < new Date(filterStartDate)) return false;
      if (filterEndDate && reportDate > new Date(filterEndDate)) return false;

      return true;
    });
  }, [reports, filterCategory, filterStatus, filterPriority, filterCity, filterNearMe, ngoLocation, filterRadius, filterStartDate, filterEndDate, user?.uid]);

  const resetFilters = () => {
    setFilterCategory("all");
    setFilterStatus(ReportStatus.PENDING);
    setFilterPriority("all");
    setFilterCity("");
    setFilterNearMe(false);
    setFilterRadius(5);
    setFilterStartDate("");
    setFilterEndDate("");
  };

  const handleToggleNearMe = () => {
    if (!filterNearMe && !ngoLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setNgoLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setFilterNearMe(true);
            toast.success("Location acquired! Filter applied.");
          },
          () => {
            toast.error("Could not get location. Please enter manually.");
          }
        );
      } else {
        toast.error("Geolocation is not supported by your browser.");
      }
    } else {
      setFilterNearMe(!filterNearMe);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus.ACCEPTED | ReportStatus.RESOLVED) => {
    try {
      const reportRef = doc(db, "reports", reportId);
      const updateData: Partial<Report> = { status: newStatus };
      if (newStatus === ReportStatus.ACCEPTED) {
        updateData.assignedNgoId = user?.uid;
      }
      await updateDoc(reportRef, updateData);
      toast.success(`Report marked as ${newStatus}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update report";
      toast.error(message);
    }
  };

  if (authLoading || loading) {
    return <div className="flex flex-1 items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case ReportStatus.PENDING:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>;
      case ReportStatus.ACCEPTED:
        return <Badge className="bg-blue-500 hover:bg-blue-600"><CheckCircle className="w-3 h-3 mr-1"/> Accepted</Badge>;
      case ReportStatus.RESOLVED:
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1"/> Resolved</Badge>;
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

  return (
    <div className="flex-1 container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">NGO Operations Dashboard</h1>
        <Button variant="outline" size="sm" onClick={resetFilters} className="gap-2">
          <X className="h-4 w-4" /> Reset Filters
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="mb-8 bg-muted/30 border-dashed">
        <CardContent className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={ReportStatus.PENDING}>Open (Pending)</SelectItem>
                <SelectItem value={ReportStatus.ACCEPTED}>Accepted</SelectItem>
                <SelectItem value={ReportStatus.RESOLVED}>Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">Priority</label>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value={ReportPriority.HIGH}>High</SelectItem>
                <SelectItem value={ReportPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={ReportPriority.LOW}>Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">Location / City</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search City..." 
                className="pl-8" 
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <div className="flex gap-2">
              <Button 
                variant={filterNearMe ? "default" : "outline"} 
                className="flex-1 gap-2"
                onClick={handleToggleNearMe}
              >
                <MapPin className="h-4 w-4" />
                {filterNearMe ? "Proximity Active" : "Near Me"}
              </Button>
              {filterNearMe && (
                <Select value={filterRadius.toString()} onValueChange={(v) => setFilterRadius(parseInt(v))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="15">15 km</SelectItem>
                    <SelectItem value="20">20 km</SelectItem>
                    <SelectItem value="30">30 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">Date Range</label>
            <div className="flex items-center gap-2">
              <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="text-sm" />
              <span className="text-muted-foreground">to</span>
              <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredReports.length === 0 ? (
        <Card className="text-center py-20 border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No issues found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Try adjusting your filters or search terms to find relevant civic issues.
              </p>
            </div>
            <Button variant="link" onClick={resetFilters}>Clear all filters</Button>
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
                {report.status === ReportStatus.PENDING && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90" 
                    onClick={() => handleUpdateStatus(report.id, ReportStatus.ACCEPTED)}
                  >
                    Accept Issue
                  </Button>
                )}
                {report.status === ReportStatus.ACCEPTED && report.assignedNgoId === user?.uid && (
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={() => handleUpdateStatus(report.id, ReportStatus.RESOLVED)}
                  >
                    Mark as Resolved
                  </Button>
                )}
                {report.status === ReportStatus.RESOLVED && (
                  <Button className="w-full" variant="outline" disabled>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Resolved
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
