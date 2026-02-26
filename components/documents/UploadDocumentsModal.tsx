"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  organizations: any[];
  onUploadComplete: () => void;
};

export default function UploadDocumentsModal({
  isOpen,
  onClose,
  organizations,
  onUploadComplete,
}: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedOrg, setSelectedOrg] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ESC closes modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !uploading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [uploading, onClose]);

  if (!isOpen) return null;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const fileArray = Array.from(fileList);
    console.log("Files selected:", fileArray);
    setFiles(fileArray);
  };

  const handleUpload = async () => {
    console.log("Upload button clicked");

    if (!selectedOrg) {
      alert("Please select an organization.");
      return;
    }

    if (files.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    setUploading(true);

    try {
      for (const file of files) {
        console.log("Uploading file:", file.name);

        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}.${ext}`;
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Storage upload failed:", uploadError);
          continue;
        }

        console.log("Storage upload successful:", fileName);

        // Insert into database
        const { error: insertError } = await supabase
          .from("documents")
          .insert({
            organization_id: selectedOrg,
            storage_path: fileName,
            original_filename: file.name,
            status: "processing",
          });

        if (insertError) {
          console.error("Database insert failed:", insertError);
          continue;
        }

        console.log("Database insert successful:", file.name);
      }

      alert("Upload complete.");
      setFiles([]);
      onUploadComplete();
      onClose();
    } catch (err) {
      console.error("Unexpected upload error:", err);
      alert("Unexpected error occurred. Check console.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onClick={() => {
        if (!uploading) onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-xl p-6 space-y-6 relative"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={uploading}
          className="absolute top-4 right-4 text-lg"
          style={{ color: "var(--text-muted)" }}
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold">Upload Documents</h2>

        {/* Debug Upload State */}
        <div style={{ fontSize: 12, opacity: 0.6 }}>
          Uploading state: {uploading ? "TRUE" : "FALSE"}
        </div>

        {/* Organization Select */}
        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="w-full px-4 py-2 rounded-lg"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        >
          <option value="">Select Organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        {/* Drag & Drop */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition"
          style={{
            borderColor: isDragging ? "#10b981" : "var(--border)",
            background: isDragging
              ? "rgba(16,185,129,0.05)"
              : "var(--bg)",
          }}
        >
          <p className="font-medium">Drag & drop files here</p>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            or click to browse / use camera
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          capture="environment"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {/* File Preview */}
        {files.length > 0 && (
          <div
            className="max-h-32 overflow-y-auto text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            {files.map((file, i) => (
              <div key={i}>{file.name}</div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-lg"
            style={{
              background: "var(--hover)",
              border: "1px solid var(--border)",
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 rounded-lg"
            style={{
              background: "#10b981",
              color: "#fff",
              opacity: uploading ? 0.7 : 1,
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}