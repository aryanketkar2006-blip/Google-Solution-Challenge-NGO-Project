"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { 
  ReportStatus, 
  ReportPriority 
} from "@/models/types";
import { uploadImageToCloudinary } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Upload, AlertCircle } from "lucide-react";
import Image from "next/image";

const reportSchema = z.object({
  category: z.string().trim().min(3, "Category must be at least 3 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  priority: z.nativeEnum(ReportPriority),
  latitude: z.string().min(1, "Latitude is required"),
  longitude: z.string().min(1, "Longitude is required"),
  city: z.string().optional(),
  state: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: "",
      description: "",
      priority: ReportPriority.MEDIUM,
      latitude: "",
      longitude: "",
      city: "",
      state: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleLocationDetection = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue("latitude", position.coords.latitude.toString(), { shouldValidate: true });
          setValue("longitude", position.coords.longitude.toString(), { shouldValidate: true });
          toast.success("Location detected!");
        },
        () => {
          toast.error("Could not detect location. Please enter manually.");
        }
      );
    }
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ReportFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      let imageUrl = "";
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadResult = await uploadImageToCloudinary(formData);
        imageUrl = uploadResult.url;
      }

      await addDoc(collection(db, "reports"), {
        userId: user.uid,
        userName: user.displayName || "Community Member",
        userEmail: user.email,
        category: data.category,
        description: data.description,
        location: {
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          city: data.city || "",
          state: data.state || "",
        },
        priority: data.priority,
        status: ReportStatus.PENDING,
        imageUrl,
        assignedNgoId: null,
        createdAt: new Date().toISOString(),
      });

      toast.success("Report submitted successfully!");
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Failed to submit report";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Report a Civic Issue</CardTitle>
          <CardDescription>Provide details about the issue to help NGOs take action.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input placeholder="e.g., Pothole, Garbage, Water Leak" {...register("category")} />
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea placeholder="Explain the issue in detail..." {...register("description")} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select 
                  defaultValue={ReportPriority.MEDIUM}
                  onValueChange={(val) => setValue("priority", val as ReportPriority)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ReportPriority.LOW}>Low</SelectItem>
                    <SelectItem value={ReportPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={ReportPriority.HIGH}>High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Image (Optional)</label>
                <div className="flex items-center gap-2">
                  <Input type="file" accept="image/*" className="hidden" id="image-upload" onChange={onImageChange} />
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={() => document.getElementById('image-upload')?.click()}>
                    <Upload className="h-4 w-4" /> Upload
                  </Button>
                </div>
              </div>
            </div>

            {imagePreview && (
              <div className="relative h-48 w-full rounded-lg overflow-hidden border">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              </div>
            )}

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Location Details</label>
                <Button type="button" variant="ghost" size="sm" className="text-primary gap-1" onClick={handleLocationDetection}>
                  <MapPin className="h-3 w-3" /> Detect My Location
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input placeholder="Latitude" {...register("latitude")} />
                </div>
                <div className="space-y-1">
                  <Input placeholder="Longitude" {...register("longitude")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="City (Optional)" {...register("city")} />
                <Input placeholder="State (Optional)" {...register("state")} />
              </div>
              {(errors.latitude || errors.longitude) && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Location coordinates are required.
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              Submit Report
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
