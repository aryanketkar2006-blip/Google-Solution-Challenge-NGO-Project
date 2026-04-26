"use client";

import { useState } from "react";
import { CollaborationSectionProps, ReportStatus, CollaborationStatus, NgoOption } from "@/models/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollaborationSection({
  report,
  user,
  activeCollaborations,
  availableNgos,
  onRevoke,
  onRemoveCollaborator,
  handleInviteNgo,
  inviting,
  fetchNgos,
}: CollaborationSectionProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [ngoSearch, setNgoSearch] = useState("");
  const [selectedNgos, setSelectedNgos] = useState<NgoOption[]>([]);

  const isAssignedNgo = report.assignedNgoId === user?.uid;

  if (!isAssignedNgo && (!report.collaboratorIds || report.collaboratorIds.length === 0)) {
    return null;
  }

  const acceptedCollaborators = activeCollaborations.filter(c => c.status === CollaborationStatus.ACCEPTED);

  return (
    <div className="space-y-4 rounded-xl border bg-background p-4">
      <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
        <Users className="h-3 w-3" /> Collaborating NGOs
      </h4>

      {isAssignedNgo && report.status === ReportStatus.ACCEPTED && (
        <Dialog open={isInviteDialogOpen} onOpenChange={(open) => {
          setIsInviteDialogOpen(open);
          if (open) {
            fetchNgos();
            setNgoSearch("");
            setSelectedNgos([]);
          }
        }}>
          <DialogTrigger render={<Button variant="outline" className="w-full sm:w-auto">Invite Collaborators</Button>} />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite NGOs</DialogTitle>
              <DialogDescription>
                Select one or more NGOs to assist with this issue.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search NGO by name..." 
                  className="pl-8"
                  value={ngoSearch}
                  onChange={(e) => setNgoSearch(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {availableNgos
                  .filter(ngo => ngo.name.toLowerCase().includes(ngoSearch.toLowerCase()))
                  .map((ngo) => {
                    const colab = activeCollaborations.find(c => c.receiverId === ngo.id);
                    const isPending = colab?.status === CollaborationStatus.PENDING;
                    const isAccepted = colab?.status === CollaborationStatus.ACCEPTED;
                    const isSelected = selectedNgos.some(s => s.id === ngo.id);
                    
                    return (
                      <div 
                        key={ngo.id} 
                        className={cn(
                          "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                          isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                          (isPending || isAccepted) && "opacity-60 cursor-default"
                        )}
                        onClick={() => {
                          if (!isPending && !isAccepted) {
                            if (isSelected) {
                              setSelectedNgos(prev => prev.filter(p => p.id !== ngo.id));
                            } else {
                              setSelectedNgos(prev => [...prev, ngo]);
                            }
                          }
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{ngo.name}</span>
                          {isPending && <span className="text-[10px] text-orange-600 font-semibold uppercase">Pending Response</span>}
                          {isAccepted && <span className="text-[10px] text-green-600 font-semibold uppercase">Collaborator</span>}
                        </div>
                        
                        {isPending && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRevoke(colab.id, ngo.name);
                            }}
                          >
                            Revoke
                          </Button>
                        )}
                        
                        {!isPending && !isAccepted && (
                          <div className={cn(
                            "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                            isSelected ? "bg-primary border-primary" : "border-muted"
                          )}>
                            {isSelected && <Loader2 className="h-3.5 w-3.5 text-white" />}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
              <Button 
                disabled={selectedNgos.length === 0 || inviting} 
                onClick={() => {
                   handleInviteNgo(selectedNgos);
                   setIsInviteDialogOpen(false);
                }}
              >
                {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                {selectedNgos.length > 1 ? `Send ${selectedNgos.length} Invitations` : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {acceptedCollaborators.length > 0 ? (
        <div className="pt-1">
          <div className="flex flex-wrap gap-2">
            {acceptedCollaborators.map(c => (
              <Badge key={c.id} variant="secondary" className="pl-1 pr-1 py-0.5 flex items-center gap-1">
                <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
                  {c.receiverName[0]}
                </div>
                {c.receiverName}
                {isAssignedNgo && report.status === ReportStatus.ACCEPTED && (
                  <button
                    type="button"
                    className="ml-1 rounded p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveCollaborator(c.id, c.receiverId, c.receiverName)}
                    aria-label={`Remove ${c.receiverName} from collaboration`}
                    title="Remove collaborator"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No active collaborators yet.</p>
      )}
    </div>
  );
}
