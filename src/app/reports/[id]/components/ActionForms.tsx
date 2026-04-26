"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Upload, Trash2, History, MessageSquare, ShieldCheck, UserRound } from "lucide-react";
import Image from "next/image";
import { ActionFormsProps } from "@/models/types";

export function ActionForms({ canAddUpdate, role, onAddActivity, onAddNote, uploading }: ActionFormsProps) {
  const canLogActivity = role === "NGO";
  const [activeMode, setActiveMode] = useState<"activity" | "note">(canLogActivity ? "activity" : "note");
  
  // Activity state
  const [activityTitle, setActivityTitle] = useState("");
  const [activityContent, setActivityContent] = useState("");
  const [activityFiles, setActivityFiles] = useState<File[]>([]);
  const activityInputRef = useRef<HTMLInputElement>(null);

  // Note state
  const [noteContent, setNoteContent] = useState("");
  const [noteFiles, setNoteFiles] = useState<File[]>([]);
  const noteInputRef = useRef<HTMLInputElement>(null);

  if (!canAddUpdate) return null;

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canLogActivity) return;
    await onAddActivity(activityTitle, activityContent, activityFiles);
    setActivityTitle("");
    setActivityContent("");
    setActivityFiles([]);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddNote(noteContent, noteFiles);
    setNoteContent("");
    setNoteFiles([]);
  };

  return (
    <Card className="border-primary/20 shadow-lg sticky top-8">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <CardTitle className="text-lg">Update Issue Progress</CardTitle>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          {canLogActivity ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
          {canLogActivity ? "NGO can post activities and notes" : "Reporter can post notes only"}
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {canLogActivity && (
          <div className="mb-6 grid w-full grid-cols-2 rounded-lg bg-muted p-1">
            <Button
              type="button"
              variant={activeMode === "activity" ? "default" : "ghost"}
              className="gap-2"
              onClick={() => setActiveMode("activity")}
            >
              <History className="h-4 w-4" /> Activity Log
            </Button>
            <Button
              type="button"
              variant={activeMode === "note" ? "default" : "ghost"}
              className="gap-2"
              onClick={() => setActiveMode("note")}
            >
              <MessageSquare className="h-4 w-4" /> Notes
            </Button>
          </div>
        )}

        {canLogActivity && activeMode === "activity" ? (
          <form onSubmit={handleActivitySubmit} className="space-y-4 rounded-lg border p-4 bg-background">
            <Input
              placeholder="Activity title (e.g., Pipe inspection completed)"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Describe completed work, findings, and next steps..."
              className="min-h-[100px]"
              value={activityContent}
              onChange={(e) => setActivityContent(e.target.value)}
              required
            />

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {activityFiles.map((file, i) => (
                  <div key={i} className="relative h-16 w-16 group">
                    <Image
                      src={URL.createObjectURL(file)}
                      className="h-full w-full object-cover rounded border"
                      alt="preview"
                      width={64}
                      height={64}
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => setActivityFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 shadow-md"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="h-16 w-16 border-dashed flex flex-col gap-1 text-[10px]"
                  onClick={() => activityInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" /> Photos
                </Button>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={activityInputRef}
                onChange={(e) => setActivityFiles(Array.from(e.target.files || []))}
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish Activity
            </Button>
          </form>
        ) : (
          <form onSubmit={handleNoteSubmit} className="space-y-4 rounded-lg border p-4 bg-background">
            <Textarea
              placeholder={role === "NGO" ? "Add a progress note..." : "Add a note or follow-up for NGO teams..."}
              className="min-h-[120px]"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              required
            />

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {noteFiles.map((file, i) => (
                  <div key={i} className="relative h-16 w-16 group">
                    <Image
                      src={URL.createObjectURL(file)}
                      className="h-full w-full object-cover rounded border"
                      alt="preview"
                      width={64}
                      height={64}
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => setNoteFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 shadow-md"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="h-16 w-16 border-dashed flex flex-col gap-1 text-[10px]"
                  onClick={() => noteInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" /> Photos
                </Button>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={noteInputRef}
                onChange={(e) => setNoteFiles(Array.from(e.target.files || []))}
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish Note
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
