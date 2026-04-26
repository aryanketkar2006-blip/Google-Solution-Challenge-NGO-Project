"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, Check, Loader2, Users, X } from "lucide-react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collaboration, CollaborationStatus, TimelineItemType, UserRole } from "@/models/types";

export default function NotificationsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Collaboration[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || role !== UserRole.NGO)) {
      router.push("/dashboard");
      return;
    }

    if (!user || role !== UserRole.NGO) return;

    const colabQ = query(
      collection(db, "collaborations"),
      where("receiverId", "==", user.uid),
      where("status", "==", CollaborationStatus.PENDING)
    );

    const unsubscribe = onSnapshot(
      colabQ,
      (snapshot) => {
        const next: Collaboration[] = [];
        snapshot.forEach((docSnap) => {
          next.push({ id: docSnap.id, ...docSnap.data() } as Collaboration);
        });
        setRequests(next);
        setLoading(false);
      },
      () => {
        toast.error("Failed to load notifications");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, role, authLoading, router]);

  const handleResponse = async (
    colabId: string,
    reportId: string,
    response: CollaborationStatus.ACCEPTED | CollaborationStatus.REJECTED
  ) => {
    try {
      setBusyId(colabId);
      const colabRef = doc(db, "collaborations", colabId);
      await updateDoc(colabRef, { status: response });

      const { arrayUnion, addDoc, collection, serverTimestamp } = await import("firebase/firestore");

      if (response === CollaborationStatus.ACCEPTED) {
        const reportRef = doc(db, "reports", reportId);
        await updateDoc(reportRef, {
          collaboratorIds: arrayUnion(user?.uid),
        });

        await addDoc(collection(db, "reports", reportId, "timeline"), {
          type: TimelineItemType.COLLABORATION,
          content: `${user?.displayName || "NGO Staff"} accepted the collaboration request.`,
          authorId: user?.uid,
          authorName: user?.displayName || user?.email || "NGO Staff",
          authorRole: UserRole.NGO,
          createdAt: serverTimestamp(),
        });
        toast.success("Collaboration accepted");
      } else {
        await addDoc(collection(db, "reports", reportId, "timeline"), {
          type: TimelineItemType.COLLABORATION,
          content: `${user?.displayName || "NGO Staff"} declined the collaboration request.`,
          authorId: user?.uid,
          authorName: user?.displayName || user?.email || "NGO Staff",
          authorRole: UserRole.NGO,
          createdAt: serverTimestamp(),
        });
        toast.info("Collaboration request declined");
      }
    } catch {
      toast.error("Failed to process collaboration request");
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 container py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-7 w-7 text-primary" />
          Notifications
        </h1>
        <Link href="/ngo-dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardHeader>
            <CardTitle className="text-lg">No pending notifications</CardTitle>
            <CardDescription>You are all caught up.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => {
            const isBusy = busyId === request.id;
            return (
              <Card key={request.id} className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Request from {request.senderName}
                  </CardTitle>
                  <CardDescription>Issue: {request.reportCategory}</CardDescription>
                </CardHeader>
                <CardFooter className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={isBusy}
                    onClick={() => handleResponse(request.id, request.reportId, CollaborationStatus.ACCEPTED)}
                  >
                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={isBusy}
                    onClick={() => handleResponse(request.id, request.reportId, CollaborationStatus.REJECTED)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
