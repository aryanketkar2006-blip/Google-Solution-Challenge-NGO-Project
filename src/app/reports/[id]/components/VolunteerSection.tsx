"use client";

import { useState } from "react";
import { VolunteerSectionProps, VolunteerStatus, ReportStatus, UserRole } from "@/models/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, Clock } from "lucide-react";
import { format } from "date-fns";

export function VolunteerSection({
  report,
  user,
  role,
  volunteers,
  onVolunteer,
  onWithdraw,
  volunteering,
}: VolunteerSectionProps) {
  const [isVolunteerDialogOpen, setIsVolunteerDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [note, setNote] = useState("");
  const [availability, setAvailability] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");

  const activeVolunteers = volunteers.filter(v => v.status === VolunteerStatus.ACTIVE);
  const isVolunteering = activeVolunteers.some(v => v.userId === user?.uid);
  const isNgo = role === UserRole.NGO;
  const isCitizenFlow = role === UserRole.USER && report.status !== ReportStatus.RESOLVED && report.status !== ReportStatus.WITHDRAWN;

  if (isNgo && activeVolunteers.length === 0) return null;
  if (!isNgo && !isCitizenFlow) return null;

  return (
    <div className="space-y-4 rounded-xl border bg-background p-4">
      {/* NGO View: List of volunteers */}
      {isNgo && activeVolunteers.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
            <Users className="h-3 w-3" /> Community Volunteers
          </h4>
          <div className="space-y-3">
            {activeVolunteers.map((vol) => (
              <div key={vol.id} className="p-3 bg-muted/50 rounded-lg text-sm border">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-primary">{vol.userName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {vol.createdAt ? (
                      format(
                        'toDate' in vol.createdAt ? vol.createdAt.toDate() : new Date(vol.createdAt), 
                        "MMM d"
                      )
                    ) : "Recent"}
                  </span>
                </div>
                {vol.note && <p className="text-muted-foreground text-xs italic mb-1">&quot;{vol.note}&quot;</p>}
                {vol.availability && (
                  <div className="text-[10px] flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" /> {vol.availability}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citizen View: Volunteer button */}
      {isCitizenFlow && (
        <div>
          {isVolunteering ? (
            <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
              <DialogTrigger render={<Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5">Withdraw Volunteering</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw as Volunteer?</DialogTitle>
                  <DialogDescription>Please let the NGO know why you are withdrawing.</DialogDescription>
                </DialogHeader>
                <Textarea 
                  placeholder="Reason for withdrawal..." 
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>Cancel</Button>
                  <Button 
                    variant="destructive" 
                    disabled={volunteering}
                    onClick={async () => {
                      await onWithdraw(withdrawReason);
                      setIsWithdrawDialogOpen(false);
                      setWithdrawReason("");
                    }}
                  >
                    Confirm Withdrawal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isVolunteerDialogOpen} onOpenChange={setIsVolunteerDialogOpen}>
              <DialogTrigger render={<Button className="w-full gap-2"><Users className="h-4 w-4" /> Volunteer for this Issue</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Volunteer for this Issue</DialogTitle>
                  <DialogDescription>Offer your help to the NGOs working on this problem.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Note (Optional)</label>
                    <Textarea 
                      placeholder="How can you help? (e.g., I have a truck for garbage removal)" 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Availability (Optional)</label>
                    <Input 
                      placeholder="e.g., Weekends only, After 6 PM" 
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsVolunteerDialogOpen(false)}>Cancel</Button>
                  <Button 
                    disabled={volunteering}
                    onClick={async () => {
                      await onVolunteer(note, availability);
                      setIsVolunteerDialogOpen(false);
                      setNote("");
                      setAvailability("");
                    }}
                  >
                    Join as Volunteer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
}
