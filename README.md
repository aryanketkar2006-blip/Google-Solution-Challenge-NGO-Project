📋 Table of Contents

Overview
Features
Tech Stack
Getting Started

Prerequisites
Installation
Environment Variables

Project Structure
Data Models
Workflow
User Roles
Contributing


🌍 Overview
SupportSync is a full-stack civic issue management platform that empowers citizens to report local problems (broken pipes, road damage, public safety hazards, etc.) and enables NGOs to track, manage, and resolve them collaboratively.
Key differentiators:

Multi-NGO collaboration — NGOs can invite other organizations to co-manage an issue.
Citizen volunteering — Citizens can go beyond just reporting; they can sign up to help resolve issues.
Timeline-based tracking — Every issue has a rich, social-feed-style activity log.
Role-based access — Citizens, NGOs, and Admins each get a tailored experience.


✨ Features
FeatureDescription📝 Issue ReportingCitizens submit civic issues with photos, location, and priority🗺️ NGO DiscoveryNGOs browse and accept open issues in their area🤝 NGO CollaborationAssigned NGOs can invite other NGOs to help🙋 Citizen VolunteeringCitizens sign up to provide manual help on active issues📅 Timeline FeedChronological activity log per issue (notes, photos, status changes)🔔 NotificationsCentralized alerts for all platform events🔐 AuthEmail/password and Google OAuth with role-based redirects🖼️ Image UploadsCloudinary-backed media storage for issue photos and updates

🛠️ Tech Stack
LayerTechnologyFrameworkNext.js 14 (App Router)LanguageTypeScriptStylingTailwind CSS + shadcn/uiAuthFirebase Authentication (Email/Password & Google OAuth)DatabaseFirebase Firestore (NoSQL)Media StorageCloudinaryFormsReact Hook Form + ZodNotificationsSonner

🚀 Getting Started
Prerequisites
Make sure you have the following installed:

Node.js v18+
npm or pnpm
A Firebase project with Firestore and Authentication enabled
A Cloudinary account

Installation
bash# 1. Clone the repository
git clone https://github.com/your-org/civix.git
cd civix

# 2. Install dependencies
npm install

# 3. Set up environment variables (see below)
cp .env.example .env.local

# 4. Run the development server
npm run dev
Open http://localhost:3000 in your browser.
Environment Variables
Create a .env.local file in the root directory with the following keys:
env# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

⚠️ Never commit .env.local to version control. It is already included in .gitignore.


📁 Project Structure
src/
├── app/
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page with role selection
│   ├── dashboard/              # Citizen dashboard
│   ├── ngo-dashboard/          # NGO command center
│   │   └── accepted/           # Active tasks for NGOs
│   ├── report/                 # Issue submission form
│   ├── reports/
│   │   └── [id]/               # Dynamic issue detail page
│   │       ├── IssueHeader.tsx
│   │       ├── ActionForms.tsx
│   │       ├── TimelineFeed.tsx
│   │       ├── TimelineItem.tsx
│   │       ├── CollaborationSection.tsx
│   │       ├── VolunteerSection.tsx
│   │       └── ReportActions.tsx
│   ├── notifications/          # Notification hub
│   └── actions/
│       └── upload.ts           # Server Action for Cloudinary uploads
├── models/
│   └── types.ts                # All TypeScript interfaces & enums
├── components/                 # Shared UI components
├── lib/                        # Firebase config, utilities
└── providers/
    └── AuthProvider.tsx        # Auth context & route protection

🗃️ Data Models
All types are defined in src/models/types.ts.
User Roles
USER (Citizen) · NGO · ADMIN · SYSTEM
Report
Represents a civic issue.
FieldTypeDescriptionidstringUnique identifieruserIdstringReporting citizencategorystringType of issuedescriptionstringDetailed descriptionlocationobjectlat, lng, city, statepriorityenumLOW · MEDIUM · HIGHstatusenumPENDING · ACCEPTED · RESOLVED · WITHDRAWNimageUrlstringCloudinary image URLassignedNgoIdstringPrimary NGO assignedcollaboratorIdsstring[]Co-managing NGO IDs
Timeline Events
Each report has a timeline of events:
TypeTriggerSTATUS_CHANGEIssue moves between statusesACTIVITYNGO posts a work update with photosNOTEGeneral comment addedCOLLABORATIONNGO invite sent or acceptedVOLUNTEERCitizen signs up to helpAUTOSystem-generated events

🔄 Workflow
Citizen submits report (PENDING)
        ↓
NGO accepts issue (ACCEPTED)
        ↓
  ┌─────────────────────────┐
  │  NGO invites collaborators (optional)
  │  Citizens volunteer     (optional)
  │  NGO posts updates to timeline
  └─────────────────────────┘
        ↓
NGO marks issue resolved (RESOLVED)
        ↓
All participants notified 🎉

👥 User Roles
🙋 Citizen (USER)

Submit new civic issue reports
Track the status of their own reports
Volunteer to assist NGOs on active issues

🏢 NGO

Browse and accept pending issues
Post timeline updates (notes, activity, photos)
Invite other NGOs to collaborate
Mark issues as resolved

🛡️ Admin

Full platform oversight
Manage users and organizations


🤝 Contributing
Contributions are welcome! Please follow these steps:

Fork the repository
Create a feature branch: git checkout -b feat/your-feature-name
Commit your changes: git commit -m 'feat: add your feature'
Push to the branch: git push origin feat/your-feature-name
Open a Pull Request

Please make sure your code passes linting (npm run lint) before submitting.