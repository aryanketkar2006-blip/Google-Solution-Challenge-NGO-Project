"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar, Clock, CheckCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Report, ReportStatus } from "@/models/types";

export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const q = query(
        collection(db, "reports"),
        where("userId", "==", user.uid),
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

      return () => unsubscribe();
    }
  }, [user, authLoading, router]);

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

  return (
    <div className="flex-1 container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Reports</h1>
      </div>

      {reports.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">You haven&apos;t reported any issues yet.</p>
            <Button onClick={() => router.push("/report")}>Report an Issue</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Link href={`/reports/${report.id}`} key={report.id}>
              <Card className="overflow-hidden hover:ring-2 hover:ring-primary transition-all cursor-pointer h-full">
                {report.imageUrl && (
                  <div className="w-full h-48 bg-muted relative">
                    <Image 
                      src={report.imageUrl} 
                      alt={report.category} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{report.category}</CardTitle>
                    {getStatusBadge(report.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {report.description}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{report.location.city ? `${report.location.city}, ${report.location.state}` : `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
