"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const { role } = useAuth();

  // Don't show breadcrumbs on landing page or auth pages
  if (pathname === "/" || pathname === "/welcome" || pathname === "/login" || pathname === "/signup" || pathname === "/dashboard" || pathname === "/report" || pathname.startsWith("/ngo-dashboard")) return null;

  const pathSegments = pathname.split("/").filter((v) => v.length > 0);
  
  const breadcrumbs = [];

  // Always start with Home
  breadcrumbs.push({ label: "Home", href: "/" });

  // Handle NGO Flow
  if (role === "NGO") {
    if (pathname.startsWith("/ngo-dashboard")) {
      breadcrumbs.push({ label: "Dashboard", href: "/ngo-dashboard" });
      
      if (pathname.includes("/accepted")) {
        breadcrumbs.push({ label: "My Tasks", href: "/ngo-dashboard/accepted" });
      }
    }
    
    if (pathname.startsWith("/reports/")) {
      // If we came from a specific dashboard, we could track it, 
      // but standard static breadcrumb is safer.
      // Default NGO details breadcrumb: Home / Dashboard / Issue Details
      breadcrumbs.push({ label: "Dashboard", href: "/ngo-dashboard" });
      breadcrumbs.push({ label: "Issue Details", href: pathname });
    }
  } 
  // Handle Reporter Flow
  else {
    if (pathname === "/dashboard") {
      breadcrumbs.push({ label: "My Reports", href: "/dashboard" });
    }
    
    if (pathname === "/report") {
      breadcrumbs.push({ label: "Report Issue", href: "/report" });
    }

    if (pathname.startsWith("/reports/")) {
      breadcrumbs.push({ label: "My Reports", href: "/dashboard" });
      breadcrumbs.push({ label: "Issue Details", href: pathname });
    }
  }

  // Fallback for unknown routes or catch-all
  if (breadcrumbs.length === 1 && pathSegments.length > 0) {
    pathSegments.forEach((segment, index) => {
      // Skip if it's an ID (simple check: length > 15 or contains numbers)
      if (segment.length > 15) {
        breadcrumbs.push({ label: "Details", href: pathname });
      } else {
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
        const href = "/" + pathSegments.slice(0, index + 1).join("/");
        breadcrumbs.push({ label, href });
      }
    });
  }

  // Remove duplicate labels (simple unique check by label)
  const uniqueBreadcrumbs = breadcrumbs.filter((v, i, a) => a.findIndex(t => t.label === v.label) === i);

  return (
    <nav className="container py-3 px-4 md:px-8 border-b bg-muted/20" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-hide">
        {uniqueBreadcrumbs.map((crumb, index) => {
          const isLast = index === uniqueBreadcrumbs.length - 1;

          return (
            <li key={crumb.href} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />}
              
              {isLast ? (
                <span className="font-semibold text-foreground truncate max-w-[150px] md:max-w-xs">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  {crumb.label === "Home" && <Home className="h-3.5 w-3.5" />}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
