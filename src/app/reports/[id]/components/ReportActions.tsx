"use client";

import { useState } from "react";
import { ReportActionsProps, ReportStatus, UserRole } from "@/models/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ReportActions({ report, user, role, handleUpdateStatus, handleWithdraw }: ReportActionsProps) {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");

  const isAssignedNgo = report.assignedNgoId === user?.uid;
  const isReporter = report.userId === user?.uid;

  return (
    <div className="space-y-2 w-full">
      {/* NGO Actions */}
      {role === UserRole.NGO && report.status === ReportStatus.PENDING && (
        <Button className="w-full" onClick={() => handleUpdateStatus(ReportStatus.ACCEPTED)}>
          Accept Issue
        </Button>
      )}

      {report.status === ReportStatus.ACCEPTED && isAssignedNgo && (
        <Button className="w-full" onClick={() => handleUpdateStatus(ReportStatus.RESOLVED)}>
          Mark as Resolved
        </Button>
      )}

      {/* Reporter Actions */}
      {isReporter && report.status !== ReportStatus.RESOLVED && report.status !== ReportStatus.WITHDRAWN && (
        <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
          <DialogTrigger render={<Button variant="outline" className="w-full text-destructive">Withdraw Report</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw this Report?</DialogTitle>
              <DialogDescription>
                Are you sure you want to withdraw this issue? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea 
                placeholder="Reason for withdrawal..." 
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={async () => {
                  await handleWithdraw(withdrawReason);
                  setIsWithdrawDialogOpen(false);
                }}
              >
                Withdraw Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {report.status === ReportStatus.RESOLVED && (
        <Button className="w-full" variant="outline" disabled>
          Already Resolved
        </Button>
      )}
    </div>
  );
}
