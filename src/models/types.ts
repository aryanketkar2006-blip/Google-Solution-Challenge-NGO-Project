export enum ReportStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  RESOLVED = "RESOLVED",
  WITHDRAWN = "WITHDRAWN",
}

export enum ReportPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum TimelineItemType {
  ACTIVITY = "ACTIVITY",
  NOTE = "NOTE",
  AUTO = "AUTO",
  STATUS_CHANGE = "STATUS_CHANGE",
  COLLABORATION = "COLLABORATION",
  VOLUNTEER = "VOLUNTEER",
}

export enum UserRole {
  USER = "USER",
  NGO = "NGO",
  SYSTEM = "SYSTEM",
  ADMIN = "ADMIN",
}

export enum CollaborationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export enum VolunteerStatus {
  ACTIVE = "ACTIVE",
  WITHDRAWN = "WITHDRAWN",
}

export interface Location {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
}

export interface Report {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  category: string;
  description: string;
  location: Location;
  priority: ReportPriority;
  status: ReportStatus;
  createdAt: string;
  imageUrl?: string;
  assignedNgoId?: string | null;
  collaboratorIds?: string[];
}

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  title?: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  imageUrls?: string[];
  createdAt: { toDate: () => Date } | Date;
  updatedAt?: { toDate: () => Date } | Date;
  isDeleted?: boolean;
}

export interface Collaboration {
  id: string;
  reportId: string;
  reportCategory: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  status: CollaborationStatus;
  createdAt: { toDate: () => Date } | Date;
}

export interface Volunteer {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  status: VolunteerStatus;
  note?: string;
  availability?: string;
  createdAt: { toDate: () => Date } | Date;
  withdrawnReason?: string;
  withdrawnAt?: { toDate: () => Date } | Date;
}

export interface UserRef {
  uid: string;
}

export interface NgoOption {
  id: string;
  name: string;
}

export interface TimelineItemProps {
  item: TimelineItem;
  user: UserRef | null;
  onDelete: (itemId: string) => Promise<void>;
  onEdit: (item: TimelineItem) => void;
  canEditOrDelete: (item: TimelineItem) => boolean;
}

export interface TimelineFeedProps {
  timeline: TimelineItem[];
  onDelete: (itemId: string) => Promise<void>;
  onEdit: (item: TimelineItem) => void;
  canEditOrDelete: (item: TimelineItem) => boolean;
  loading: boolean;
}

export interface ActionFormsProps {
  canAddUpdate: boolean;
  role: string | null;
  onAddActivity: (title: string, content: string, images: File[]) => Promise<void>;
  onAddNote: (content: string, images: File[]) => Promise<void>;
  uploading: boolean;
}

export interface IssueHeaderProps {
  report: Report;
}

export interface CollaborationSectionProps {
  report: Report;
  user: UserRef | null;
  activeCollaborations: Collaboration[];
  availableNgos: NgoOption[];
  onRevoke: (colabId: string, ngoName: string) => Promise<void>;
  onRemoveCollaborator: (colabId: string, ngoId: string, ngoName: string) => Promise<void>;
  handleInviteNgo: (selectedNgos: NgoOption[]) => Promise<void>;
  inviting: boolean;
  fetchNgos: () => Promise<void>;
}

export interface VolunteerSectionProps {
  report: Report;
  user: UserRef | null;
  role: string | null;
  volunteers: Volunteer[];
  onVolunteer: (note: string, availability: string) => Promise<void>;
  onWithdraw: (reason: string) => Promise<void>;
  volunteering: boolean;
}

export interface ReportActionsProps {
  report: Report;
  user: UserRef | null;
  role: string | null;
  handleUpdateStatus: (status: ReportStatus.ACCEPTED | ReportStatus.RESOLVED) => Promise<void>;
  handleWithdraw: (reason: string) => Promise<void>;
}
