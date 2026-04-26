"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc,
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  where,
  getDocs,
  deleteDoc,
  arrayRemove
} from "firebase/firestore";
import { toast } from "sonner";
import { 
  Report, 
  TimelineItem, 
  Collaboration, 
  Volunteer, 
  ReportStatus, 
  TimelineItemType,
  UserRole 
} from "@/models/types";
import Image from "next/image";
import { Loader2, History, MessageSquare, AlertCircle, User } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uploadImageToCloudinary } from "@/app/actions/upload";

// Components
import { IssueHeader } from "./components/IssueHeader";
import { CollaborationSection } from "./components/CollaborationSection";
import { VolunteerSection } from "./components/VolunteerSection";
import { TimelineFeed } from "./components/TimelineFeed";
import { ActionForms } from "./components/ActionForms";
import { ReportActions } from "./components/ReportActions";

export default function ReportDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  
  const [report, setReport] = useState<Report | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [availableNgos, setAvailableNgos] = useState<{id: string, name: string}[]>([]);
  const [activeCollaborations, setActiveCollaborations] = useState<Collaboration[]>([]);
  const [inviting, setInviting] = useState(false);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [volunteering, setVolunteering] = useState(false);
  const [actorName, setActorName] = useState("User");
  const [pendingDeleteItem, setPendingDeleteItem] = useState<TimelineItem | null>(null);
  const [pendingEditItem, setPendingEditItem] = useState<TimelineItem | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [pendingCollaboratorRemoval, setPendingCollaboratorRemoval] = useState<{ colabId: string; ngoId: string; ngoName: string } | null>(null);

  const resolveActorName = async () => {
    if (!user?.uid) return user?.displayName || user?.email || "User";
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const dbName = userSnap.exists() ? userSnap.data()?.name : null;
      return dbName || user?.displayName || user?.email || "User";
    } catch {
      return user?.displayName || user?.email || "User";
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const reportRef = doc(db, "reports", id as string);
    const unsubscribeReport = onSnapshot(reportRef, (docSnap) => {
      if (docSnap.exists()) {
        setReport({ id: docSnap.id, ...docSnap.data() } as Report);
      } else {
        toast.error("Report not found");
      }
    }, (error) => {
      console.error(error);
    });

    const q = query(
      collection(db, "reports", id as string, "timeline"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hydrateTimelineAuthorNames = async () => {
        const timelineData: TimelineItem[] = [];
        snapshot.forEach((docSnap) => {
          timelineData.push({ id: docSnap.id, ...docSnap.data() } as TimelineItem);
        });

        const uniqueAuthorIds = Array.from(
          new Set(
            timelineData
              .map((item) => item.authorId)
              .filter((authorId): authorId is string => Boolean(authorId))
          )
        );

        const authorEntries = await Promise.all(
          uniqueAuthorIds.map(async (authorId) => {
            try {
              const authorSnap = await getDoc(doc(db, "users", authorId));
              if (!authorSnap.exists()) return [authorId, null] as const;
              const authorData = authorSnap.data() as { name?: string };
              return [authorId, authorData.name || null] as const;
            } catch {
              return [authorId, null] as const;
            }
          })
        );

        const authorNameMap = new Map(authorEntries);
        const enrichedTimeline = timelineData.map((item) => {
          const dbName = authorNameMap.get(item.authorId);
          return dbName ? { ...item, authorName: dbName } : item;
        });

        setTimeline(enrichedTimeline);
        setLoading(false);
      };

      void hydrateTimelineAuthorNames();
    });

    const colabQ = query(
      collection(db, "collaborations"),
      where("reportId", "==", id as string)
    );

    const unsubscribeColab = onSnapshot(colabQ, (snapshot) => {
      const colabs: Collaboration[] = [];
      snapshot.forEach((doc) => {
        colabs.push({ id: doc.id, ...doc.data() } as Collaboration);
      });
      setActiveCollaborations(colabs);
    });

    const volQ = query(
      collection(db, "volunteers"),
      where("reportId", "==", id as string)
    );

    const unsubscribeVol = onSnapshot(volQ, (snapshot) => {
      const volData: Volunteer[] = [];
      snapshot.forEach((doc) => {
        volData.push({ id: doc.id, ...doc.data() } as Volunteer);
      });
      setVolunteers(volData);
    });

    const fetchActorName = async () => {
      const resolved = await resolveActorName();
      setActorName(resolved);
    };
    fetchActorName();

    return () => {
      unsubscribeReport();
      unsubscribe();
      unsubscribeColab();
      unsubscribeVol();
    };
  }, [id, user, authLoading, router]);

  const fetchNgos = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "NGO"));
      const snapshot = await getDocs(q);
      const ngos: {id: string, name: string}[] = [];
      snapshot.forEach((doc) => {
        if (doc.id !== user?.uid && doc.id !== report?.assignedNgoId) {
          ngos.push({ id: doc.id, name: doc.data().name });
        }
      });
      setAvailableNgos(ngos);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInviteNgo = async (selectedNgos: {id: string, name: string}[]) => {
    try {
      setInviting(true);
      const currentActorName = await resolveActorName();
      const promises = selectedNgos.map(ngo => 
        addDoc(collection(db, "collaborations"), {
          reportId: id,
          reportCategory: report?.category,
          senderId: user?.uid,
          senderName: currentActorName,
          receiverId: ngo.id,
          receiverName: ngo.name,
          status: "PENDING",
          createdAt: serverTimestamp(),
        })
      );

      const logPromises = selectedNgos.map(ngo =>
        addDoc(collection(db, "reports", id as string, "timeline"), {
          type: TimelineItemType.COLLABORATION,
          content: `${currentActorName} invited ${ngo.name} to collaborate on this issue.`,
          authorId: user?.uid,
          authorName: currentActorName,
          authorRole: UserRole.NGO,
          createdAt: serverTimestamp(),
        })
      );

      await Promise.all([...promises, ...logPromises]);
      toast.success(`Collaboration requests sent to ${selectedNgos.length} NGOs`);
    } catch {
      toast.error("Failed to send invites");
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (colabId: string, ngoName: string) => {
    try {
      const currentActorName = await resolveActorName();
      await deleteDoc(doc(db, "collaborations", colabId));
      await addDoc(collection(db, "reports", id as string, "timeline"), {
        type: TimelineItemType.COLLABORATION,
        content: `${currentActorName} revoked the invitation to ${ngoName}.`,
        authorId: user?.uid,
        authorName: currentActorName,
        authorRole: UserRole.NGO,
        createdAt: serverTimestamp(),
      });
      toast.success("Invitation revoked");
    } catch {
      toast.error("Failed to revoke invitation");
    }
  };

  const handleRemoveCollaborator = async (colabId: string, ngoId: string, ngoName: string) => {
    setPendingCollaboratorRemoval({ colabId, ngoId, ngoName });
  };

  const confirmRemoveCollaborator = async () => {
    if (!pendingCollaboratorRemoval) return;
    try {
      const { colabId, ngoId, ngoName } = pendingCollaboratorRemoval;
      const currentActorName = await resolveActorName();
      await updateDoc(doc(db, "reports", id as string), {
        collaboratorIds: arrayRemove(ngoId),
      });
      await deleteDoc(doc(db, "collaborations", colabId));
      await addDoc(collection(db, "reports", id as string, "timeline"), {
        type: TimelineItemType.COLLABORATION,
        content: `${currentActorName} removed ${ngoName} from collaborators.`,
        authorId: user?.uid,
        authorName: currentActorName,
        authorRole: UserRole.NGO,
        createdAt: serverTimestamp(),
      });
      toast.success(`${ngoName} removed from collaboration`);
    } catch {
      toast.error("Failed to remove collaborator");
    } finally {
      setPendingCollaboratorRemoval(null);
    }
  };

  const handleVolunteer = async (note: string, availability: string) => {
    try {
      setVolunteering(true);
      const currentActorName = await resolveActorName();
      await addDoc(collection(db, "volunteers"), {
        reportId: id,
        userId: user?.uid,
        userName: currentActorName,
        userEmail: user?.email,
        status: "ACTIVE",
        note,
        availability,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "reports", id as string, "timeline"), {
        type: TimelineItemType.VOLUNTEER,
        content: `${currentActorName} volunteered for this issue.`,
        authorId: user?.uid,
        authorName: currentActorName,
        authorRole: UserRole.USER,
        createdAt: serverTimestamp(),
      });
      toast.success("Thank you for volunteering!");
    } catch {
      toast.error("Failed to join as volunteer");
    } finally {
      setVolunteering(false);
    }
  };

  const handleWithdrawVolunteer = async (reason: string) => {
    try {
      setVolunteering(true);
      const currentActorName = await resolveActorName();
      const volRef = volunteers.find(v => v.userId === user?.uid && v.status === "ACTIVE");
      if (!volRef) return;
      await updateDoc(doc(db, "volunteers", volRef.id), {
        status: "WITHDRAWN",
        withdrawnReason: reason,
        withdrawnAt: serverTimestamp(),
      });
      await addDoc(collection(db, "reports", id as string, "timeline"), {
        type: TimelineItemType.VOLUNTEER,
        content: `${currentActorName} withdrew as a volunteer. Reason: ${reason}`,
        authorId: user?.uid,
        authorName: currentActorName,
        authorRole: UserRole.USER,
        createdAt: serverTimestamp(),
      });
      toast.success("Volunteer participation withdrawn");
    } catch {
      toast.error("Failed to withdraw");
    } finally {
      setVolunteering(false);
    }
  };

  const handleAddNote = async (content: string, images: File[]) => {
    try {
      setUploading(true);
      const imageUrls: string[] = [];
      for (const file of images) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResult = await uploadImageToCloudinary(formData);
        imageUrls.push(uploadResult.url);
      }

      await addDoc(collection(db, "reports", id as string, "timeline"), {
        type: TimelineItemType.NOTE,
        content,
        authorId: user?.uid,
        authorName: actorName,
        authorRole: role,
        imageUrls,
        createdAt: serverTimestamp(),
      });
      toast.success("Note added successfully");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setUploading(false);
    }
  };

  const handleAddActivity = async (title: string, content: string, images: File[]) => {
    try {
      setUploading(true);
      const imageUrls: string[] = [];
      for (const file of images) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResult = await uploadImageToCloudinary(formData);
        imageUrls.push(uploadResult.url);
      }

      await addDoc(collection(db, "reports", id as string, "timeline"), {
        type: TimelineItemType.ACTIVITY,
        content: `[${title}]\n${content}`,
        authorId: user?.uid,
        authorName: actorName,
        authorRole: "NGO",
        imageUrls,
        createdAt: serverTimestamp(),
      });
      toast.success("Activity logged successfully");
    } catch {
      toast.error("Failed to log activity");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: ReportStatus.ACCEPTED | ReportStatus.RESOLVED) => {
    try {
      const currentActorName = await resolveActorName();
      const reportRef = doc(db, "reports", id as string);
      const updateData: Partial<Report> = { status: newStatus };
      if (newStatus === "ACCEPTED") {
        updateData.assignedNgoId = user?.uid;
      }
      setReport((prev) => (prev ? { ...prev, ...updateData } : prev));
      await updateDoc(reportRef, updateData);
      
      await addDoc(collection(db, "reports", id as string, "timeline"), {
        type: TimelineItemType.STATUS_CHANGE,
        content: `Issue status updated to ${newStatus} by ${currentActorName}.`,
        authorId: user?.uid,
        authorName: currentActorName,
        authorRole: UserRole.NGO,
        createdAt: serverTimestamp(),
      });
      toast.success(`Report marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update report");
    }
  };

  const handleWithdraw = async (reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for withdrawal");
      return;
    }
    try {
      const currentActorName = await resolveActorName();
      const reportRef = doc(db, "reports", id as string);
      await updateDoc(reportRef, { status: "WITHDRAWN" });
      await addDoc(collection(db, "reports", id as string, "timeline"), {
        type: TimelineItemType.STATUS_CHANGE,
        content: `Issue withdrawn by reporter (${currentActorName}). Reason: ${reason}`,
        authorId: user?.uid,
        authorName: currentActorName,
        authorRole: UserRole.USER,
        createdAt: serverTimestamp(),
      });
      toast.success("Report withdrawn");
    } catch {
      toast.error("Failed to withdraw report");
    }
  };

  const handleDeleteTimelineItem = async (itemId: string) => {
    const targetItem = timeline.find((item) => item.id === itemId);
    if (!targetItem || !canEditOrDelete(targetItem)) {
      toast.error("You can only delete your own notes");
      return;
    }
    setPendingDeleteItem(targetItem);
  };

  const confirmDeleteTimelineItem = async () => {
    if (!pendingDeleteItem) return;
    try {
      await deleteDoc(doc(db, "reports", id as string, "timeline", pendingDeleteItem.id));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    } finally {
      setPendingDeleteItem(null);
    }
  };

  const handleEditTimelineItem = async (item: TimelineItem) => {
    if (!canEditOrDelete(item)) {
      toast.error("You can only edit your own notes");
      return;
    }

    setPendingEditItem(item);
    setEditingNoteContent(item.content);
  };

  const confirmEditTimelineItem = async () => {
    if (!pendingEditItem) return;
    if (!editingNoteContent.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    try {
      await updateDoc(doc(db, "reports", id as string, "timeline", pendingEditItem.id), {
        content: editingNoteContent.trim(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Note updated");
      setPendingEditItem(null);
      setEditingNoteContent("");
    } catch {
      toast.error("Failed to update note");
    }
  };

  const canEditOrDelete = (item: TimelineItem) => {
    if (!item.createdAt || item.authorId !== user?.uid) return false;
    if (item.type !== TimelineItemType.NOTE) return false;
    const createdDate = 'toDate' in item.createdAt ? item.createdAt.toDate() : new Date(item.createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  const isAssignedNgo = role === "NGO" && report?.assignedNgoId === user?.uid;
  const isCollaborator = role === "NGO" && (report?.collaboratorIds || []).includes(user?.uid || "");
  const isReporter = role === "USER" && report?.userId === user?.uid;
  const canAddUpdate = isReporter || isAssignedNgo || isCollaborator;

  if (loading && !report) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="flex-1 bg-muted/30">
      <div className="container py-8 px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-none shadow-xl bg-background">
              {report.imageUrl && (
                <div className="aspect-video w-full relative group">
                  <Image src={report.imageUrl} alt="Report" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" onClick={() => window.open(report.imageUrl, "_blank")}>View Full Image</Button>
                  </div>
                </div>
              )}
              
              <IssueHeader report={report} />
              
              <CardContent className="space-y-6 pb-8">
                <div className="bg-muted/50 p-4 rounded-xl border">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Description
                  </h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg bg-background shadow-sm">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold">Reported By</span>
                    <p className="text-sm font-medium flex items-center gap-1.5 mt-0.5">
                      <User className="h-3.5 w-3.5 text-primary" /> {report.userName || "Community Member"}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg bg-background shadow-sm">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold">Report ID</span>
                    <p className="text-sm font-medium text-primary mt-0.5 font-mono">#{report.id.substring(0, 8)}</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex-col gap-4 border-t pt-6 bg-muted/10">
                <div className="w-full space-y-4">
                  <CollaborationSection
                    report={report}
                    user={user}
                    activeCollaborations={activeCollaborations}
                    availableNgos={availableNgos}
                    onRevoke={handleRevokeInvite}
                    onRemoveCollaborator={handleRemoveCollaborator}
                    handleInviteNgo={handleInviteNgo}
                    inviting={inviting}
                    fetchNgos={fetchNgos}
                  />
                  <VolunteerSection
                    report={report}
                    user={user}
                    role={role}
                    volunteers={volunteers}
                    onVolunteer={handleVolunteer}
                    onWithdraw={handleWithdrawVolunteer}
                    volunteering={volunteering}
                  />
                </div>
                
                <ReportActions 
                   report={report}
                   user={user}
                   role={role}
                   handleUpdateStatus={handleUpdateStatus}
                   handleWithdraw={handleWithdraw}
                />
              </CardFooter>
            </Card>

            <div className="pt-4">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                <History className="h-5 w-5 text-primary" /> Issue Timeline
              </h3>
              <TimelineFeed 
                 timeline={timeline}
                 onDelete={handleDeleteTimelineItem}
                 onEdit={handleEditTimelineItem}
                 canEditOrDelete={canEditOrDelete}
                 loading={loading}
              />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <ActionForms 
               canAddUpdate={canAddUpdate && report.status !== "RESOLVED" && report.status !== "WITHDRAWN"}
               role={role}
               onAddActivity={handleAddActivity}
               onAddNote={handleAddNote}
               uploading={uploading}
            />

            {role === "NGO" && !isAssignedNgo && !isCollaborator && report.status !== "PENDING" && (
              <div className="bg-muted p-4 rounded-lg flex items-center gap-3 text-muted-foreground border border-dashed">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">You are viewing this issue as an observer. Only assigned or collaborating NGOs can post updates.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={Boolean(pendingDeleteItem)} onOpenChange={(open) => !open && setPendingDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note?</DialogTitle>
            <DialogDescription>This will permanently delete your note from the timeline.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteItem(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteTimelineItem}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingEditItem)} onOpenChange={(open) => !open && setPendingEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit note</DialogTitle>
            <DialogDescription>Update your note content and save changes.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editingNoteContent}
            onChange={(e) => setEditingNoteContent(e.target.value)}
            className="min-h-[140px]"
            placeholder="Update your note..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingEditItem(null)}>Cancel</Button>
            <Button onClick={confirmEditTimelineItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingCollaboratorRemoval)} onOpenChange={(open) => !open && setPendingCollaboratorRemoval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove collaborator?</DialogTitle>
            <DialogDescription>
              {pendingCollaboratorRemoval ? `${pendingCollaboratorRemoval.ngoName} will lose collaborator access for this issue.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingCollaboratorRemoval(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRemoveCollaborator}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
