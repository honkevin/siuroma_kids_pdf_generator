"use client";

import { useState } from "react";
import {
  Search,
  Grid,
  List,
  Trash2,
  Copy,
  FileText,
  Plus,
  Download,
  Calendar,
} from "lucide-react";
import { FormDataType } from "@/app/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SavedFile {
  id: string;
  title: string;
  lastModified: number;
  data: FormDataType;
}

interface FileExplorerProps {
  files: SavedFile[];
  onOpen: (file: SavedFile) => void;
  onDelete: (id: string) => void;
  onDuplicate: (file: SavedFile) => void;
  onNewEntry: () => void;
  onDownload: (file: SavedFile) => void;
}

export function FileExplorer({
  files,
  onOpen,
  onDelete,
  onDuplicate,
  onNewEntry,
  onDownload,
}: FileExplorerProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  const filteredFiles = files.filter((f) => {
    const query = search.toLowerCase();
    // Fix 2a: Safe check for both receiptNo and courseCode
    const receiptNo = f.data.receiptNo || "";
    const courseCode = f.data.courseCode || "";

    return (
      f.title.toLowerCase().includes(query) ||
      courseCode.toLowerCase().includes(query) ||
      receiptNo.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex-1 bg-[#f3f4f6] p-8 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header / Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Saved Entries</h1>
            <Button
              onClick={onNewEntry}
              className="h-8 bg-[#2b5cdb] hover:bg-[#1e40af] text-white text-xs gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Entry
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search name, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            <div className="flex items-center bg-white rounded-md border p-1 gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 cursor-pointer ${
                  viewMode === "grid" ? "bg-gray-100" : ""
                }`}
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 cursor-pointer ${
                  viewMode === "list" ? "bg-gray-100" : ""
                }`}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredFiles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No saved files found</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onOpen={onOpen}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onDownload={onDownload}
              />
            ))}
          </div>
        ) : (
          /* Fix 1: Added overflow-hidden to preserve rounded corners on hover */
          <div className="bg-white rounded-lg border shadow-sm divide-y overflow-hidden">
            {filteredFiles.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                onOpen={onOpen}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onDownload={onDownload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Helper Functions for Type Indication ---

const getTypeColor = (type?: string) => {
  return type === "course_plan"
    ? "bg-purple-100 text-purple-700"
    : "bg-blue-100 text-blue-700";
};

const getTypeLabel = (type?: string) => {
  return type === "course_plan" ? "Course Plan" : "Receipt";
};

const TypeIcon = ({
  type,
  className,
}: {
  type?: string;
  className?: string;
}) => {
  return type === "course_plan" ? (
    <Calendar className={className} />
  ) : (
    <FileText className={className} />
  );
};

// --- Updated File Card ---

function FileCard({ file, onOpen, onDelete, onDuplicate, onDownload }: any) {
  const isPlan = file.data.type === "course_plan";

  return (
    <div className="group relative bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
      {/* Type Badge (Absolute) */}
      <div
        className={`absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm uppercase tracking-wider ${getTypeColor(
          file.data.type
        )}`}
      >
        {isPlan ? "Course Plan" : "Receipt"}
      </div>

      <div
        onClick={() => onOpen(file)}
        className="h-40 bg-gray-50 border-b cursor-pointer relative p-4 flex justify-center items-start overflow-hidden"
      >
        {/* Preview Thumbnail */}
        <div className="w-[80%] h-[120%] bg-white shadow-sm border text-[5px] p-2 space-y-1 opacity-80 group-hover:scale-105 transition-transform pointer-events-none">
          <div
            className={`w-1/2 h-1 mb-2 ${
              isPlan ? "bg-purple-200" : "bg-blue-200"
            }`}
          />
          <div className="flex justify-between">
            <div className="w-1/3 h-0.5 bg-gray-200" />
            <div className="w-1/3 h-0.5 bg-gray-200" />
          </div>
          <div className="space-y-0.5 mt-2">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="w-full h-0.5 bg-gray-100" />
              ))}
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h3
            className="font-semibold text-sm truncate pr-2 cursor-pointer hover:underline"
            title={file.title}
            onClick={() => onOpen(file)}
          >
            {file.title || "Untitled"}
          </h3>
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          {/* Fix 2b: Display "NO COURSE CODE" if missing */}
          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase">
            {file.data.courseCode || "NO COURSE CODE"}
          </span>
          <span>{new Date(file.lastModified).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-pointer hover:text-blue-600"
            onClick={() => onDownload(file)}
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-pointer"
            onClick={() => onDuplicate(file)}
          >
            <Copy className="h-3.5 w-3.5 text-gray-500" />
          </Button>
          <DeleteConfirm onConfirm={() => onDelete(file.id)} />
        </div>
      </div>
    </div>
  );
}

// --- Updated File Row ---

function FileRow({ file, onOpen, onDelete, onDuplicate, onDownload }: any) {
  const isPlan = file.data.type === "course_plan";

  return (
    <div className="flex items-center p-3 hover:bg-gray-50 group">
      <div
        onClick={() => onOpen(file)}
        className="flex-1 flex items-center gap-4 cursor-pointer"
      >
        {/* Icon based on Type */}
        <div
          className={`h-8 w-8 rounded flex items-center justify-center ${getTypeColor(
            file.data.type
          )}`}
        >
          <TypeIcon type={file.data.type} className="h-4 w-4" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-gray-900">
              {file.title || "Untitled"}
            </p>
            {/* Small Badge for List View */}
            <span
              className={`text-[9px] px-1.5 py-px rounded-full font-medium uppercase ${getTypeColor(
                file.data.type
              )}`}
            >
              {isPlan ? "Plan" : "Receipt"}
            </span>
          </div>

          <p className="text-xs text-gray-500 flex items-center gap-2">
            <span>{new Date(file.lastModified).toLocaleDateString()}</span>
            {!isPlan && file.data.receiptNo && (
              <>
                <span>•</span>
                <span>#{file.data.receiptNo}</span>
              </>
            )}
          </p>
        </div>

        {/* Fix 3: Removed mr-8 so it sits at far right when actions are hidden */}
        <div className="ml-auto">
          {/* Fix 2c: Display "NO COURSE CODE" if missing */}
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
            {file.data.courseCode || "NO COURSE CODE"}
          </span>
        </div>
      </div>

      {/* Fix 3: Use hidden group-hover:flex so it takes no space until hover */}
      <div className="hidden group-hover:flex gap-2 ml-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer hover:text-blue-600"
          onClick={() => onDownload(file)}
          title="Download PDF"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDuplicate(file)}
          className="cursor-pointer"
        >
          Duplicate
        </Button>
        <DeleteConfirm onConfirm={() => onDelete(file.id)} />
      </div>
    </div>
  );
}

function DeleteConfirm({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-red-50 hover:text-red-600 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 cursor-pointer"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
