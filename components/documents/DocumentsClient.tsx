"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import DocumentsHeader from "./DocumentsHeader";
import DocumentsTabs from "./DocumentsTabs";
import AllDocumentsView from "./AllDocumentsView";
import ReviewDocumentsView from "./ReviewDocumentsView";
import DocumentsAnalytics from "./DocumentsAnalytics";
import DocumentsReports from "./DocumentsReports";
import UploadDocumentsModal from "./UploadDocumentsModal";

type TabType = "all" | "review" | "analytics" | "reports";

export default function DocumentsClient() {
  const supabase = createClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Fetch organizations for upload dropdown
  useEffect(() => {
    async function fetchOrganizations() {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("name");

      if (error) {
        console.error("Organization fetch error:", error);
        return;
      }

      if (data) setOrganizations(data);
    }

    fetchOrganizations();
  }, []);

  return (
    <div
      className="min-h-screen py-8"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <DocumentsHeader onUploadClick={() => setIsUploadOpen(true)} />

        <DocumentsTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="mt-8">
          {activeTab === "all" && <AllDocumentsView />}
          {activeTab === "review" && <ReviewDocumentsView />}
          {activeTab === "analytics" && <DocumentsAnalytics />}
          {activeTab === "reports" && <DocumentsReports />}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadDocumentsModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        organizations={organizations}
        onUploadComplete={() => {
          setIsUploadOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}