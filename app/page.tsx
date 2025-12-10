// page.tsx

"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { TopBar, Tab } from "@/components/layout/top-bar";
import { Ribbon } from "@/components/layout/ribbon";
import { FileExplorer } from "@/components/file-explorer";
import { ReceiptPreview, Lesson } from "@/components/receipt/receipt-preview";
import { CoursePlanPreview } from "@/components/receipt/course-plan-preview"; // Imported
import { ZoomIn, ZoomOut, Download, FileText, Calendar } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface FormDataType {
  type?: "receipt" | "course_plan"; // Added type discriminator
  receiptNo?: string; // Optional
  studentName: string;
  studentCode: string; // Always string, not optional
  gender: string;
  issueDate: string;
  courseCode: string;
  lessons: Lesson[];
  paymentMethod: string;
  paymentDate: string;
}

interface ReceiptTab extends Tab {
  data: FormDataType;
  savedFileId?: string;
  zoom: number;
  scrollTop: number;
}

interface SavedFile {
  id: string;
  title: string;
  lastModified: number;
  data: FormDataType;
}

const DEFAULT_LESSONS = Array(12).fill({ name: "", dateTime: "" });

const NEW_RECEIPT_TEMPLATE: FormDataType = {
  type: "receipt",
  receiptNo: "",
  studentName: "",
  studentCode: "",
  gender: "",
  issueDate: new Date().toISOString().split("T")[0],
  courseCode: "",
  lessons: DEFAULT_LESSONS,
  paymentMethod: "",
  paymentDate: "",
};

const NEW_COURSE_PLAN_TEMPLATE: FormDataType = {
  type: "course_plan",
  studentName: "",
  studentCode: "", // Added to fix type error
  gender: "",
  issueDate: new Date().toISOString().split("T")[0],
  courseCode: "",
  lessons: DEFAULT_LESSONS,
  paymentMethod: "",
  paymentDate: "",
  // Explicitly omitting receiptNo
};

// Initial View Constants
const INITIAL_ZOOM = 1.1;
const INITIAL_SCROLL_TOP = 0;

export default function App() {
  // --- Persistent Storage ---
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("rc_saved_files");
    if (stored) {
      try {
        setSavedFiles(JSON.parse(stored));
      } catch (e) {
        console.error("Load failed", e);
      }
    }
  }, []);

  const persistFiles = (files: SavedFile[]) => {
    setSavedFiles(files);
    localStorage.setItem("rc_saved_files", JSON.stringify(files));
  };

  // --- View State ---
  const [isFilesView, setIsFilesView] = useState(true);
  const [tabs, setTabs] = useState<ReceiptTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");

  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [isExporting, setIsExporting] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = useState(false); // New State

  const [tempExportData, setTempExportData] = useState<FormDataType | null>(
    null
  );

  // Refs
  const exportRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Computed
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeIndex = activeTab
    ? tabs.findIndex((t) => t.id === activeTabId)
    : -1;
  const hasActiveTab = !!activeTab && activeIndex !== -1;

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          if (!isFilesView && hasActiveTab) handleSaveRequest();
        }
        if (e.key === "t") {
          e.preventDefault();
          handleNewEntry();
        }
        if (e.key === "w") {
          e.preventDefault();
          if (!isFilesView && hasActiveTab) handleTabClose(activeTabId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTabId, isFilesView, hasActiveTab, tabs]);

  // --- PDF Generation Logic ---

  useEffect(() => {
    if (tempExportData && exportRef.current) {
      const timer = setTimeout(() => {
        generatePdf(tempExportData, true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [tempExportData]);

  const generatePdf = async (data: FormDataType, isBackground = false) => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      await document.fonts.ready;

      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `${
          data.receiptNo ||
          data.studentName ||
          (data.type === "course_plan" ? "CoursePlan" : "Receipt")
        }.pdf`
      );
    } catch (e) {
      alert("Export failed");
      console.error(e);
    } finally {
      setIsExporting(false);
      if (isBackground) setTempExportData(null);
    }
  };

  const handleEditorExport = () => {
    if (!hasActiveTab) return;
    generatePdf(activeTab.data);
  };

  const handleDownloadFile = (file: SavedFile) => {
    setTempExportData(file.data);
  };

  // --- Tab Switching & State Persistence Logic ---

  useLayoutEffect(() => {
    if (hasActiveTab && !isFilesView) {
      setZoom(activeTab.zoom);
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = activeTab.scrollTop;
        }
      }, 0);
    }
  }, [activeTabId, isFilesView, hasActiveTab, activeTab]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (hasActiveTab) {
      activeTab.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const updateZoom = (newZoomVal: number) => {
    const clamped = Math.min(Math.max(0.3, newZoomVal), 2.5);
    setZoom(clamped);
    if (hasActiveTab) {
      activeTab.zoom = clamped;
    }
  };

  // --- Trackpad Zoom Logic ---
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = -e.deltaY * 0.01;

        setZoom((prevZoom) => {
          const newZoom = prevZoom + zoomDelta;
          const clamped = Math.min(Math.max(0.3, newZoom), 2.5);
          if (hasActiveTab) activeTab!.zoom = clamped;
          return clamped;
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [hasActiveTab, activeTab, isFilesView]);

  // --- Actions ---

  // Opens the dialog instead of creating immediately
  const handleNewEntry = () => {
    setIsNewEntryDialogOpen(true);
  };

  const createEntry = (type: "receipt" | "course_plan") => {
    const newId = Date.now().toString();
    const newNum = tabs.length + 1;

    const template =
      type === "course_plan"
        ? { ...NEW_COURSE_PLAN_TEMPLATE }
        : { ...NEW_RECEIPT_TEMPLATE };

    const newTab: ReceiptTab = {
      id: newId,
      title: `Untitled ${newNum}`,
      data: template,
      zoom: INITIAL_ZOOM,
      scrollTop: INITIAL_SCROLL_TOP,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    setIsFilesView(false);
    setIsNewEntryDialogOpen(false);
  };

  const handleTabClose = (id: string) => {
    if (tabs.length === 1) {
      setTabs([]);
      setActiveTabId("");
      setIsFilesView(true);
      return;
    }
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const updateActiveData = (field: keyof FormDataType, value: any) => {
    if (!hasActiveTab) return;
    const newTabs = [...tabs];
    const tab = newTabs[activeIndex];
    tab.data = { ...tab.data, [field]: value };

    if (!tab.savedFileId) {
      if (field === "studentName" && value) tab.title = value;
      else if (field === "receiptNo" && value) tab.title = value;
    }
    setTabs(newTabs);
  };

  const handleSaveRequest = () => {
    if (!hasActiveTab) return;
    setShowSaveConfirm(true);
  };

  const executeSave = () => {
    if (!hasActiveTab) return;

    const fileId = activeTab.savedFileId || Date.now().toString();
    const title =
      activeTab.data.studentName ||
      activeTab.data.receiptNo ||
      (activeTab.data.type === "course_plan"
        ? "Untitled Plan"
        : "Untitled Receipt");

    const newFile: SavedFile = {
      id: fileId,
      title,
      lastModified: Date.now(),
      data: activeTab.data,
    };

    const existingIdx = savedFiles.findIndex((f) => f.id === fileId);
    const newFileList = [...savedFiles];
    if (existingIdx >= 0) {
      newFileList[existingIdx] = newFile;
    } else {
      newFileList.unshift(newFile);
    }

    persistFiles(newFileList);
    const newTabs = [...tabs];
    newTabs[activeIndex].savedFileId = fileId;
    newTabs[activeIndex].title = title;
    setTabs(newTabs);
    setShowSaveConfirm(false);
  };

  const handleOpenFile = (file: SavedFile) => {
    const openTab = tabs.find((t) => t.savedFileId === file.id);
    if (openTab) {
      setActiveTabId(openTab.id);
    } else {
      const newTab: ReceiptTab = {
        id: Date.now().toString(),
        title: file.title,
        data: file.data,
        savedFileId: file.id,
        zoom: INITIAL_ZOOM,
        scrollTop: INITIAL_SCROLL_TOP,
      };
      setTabs([...tabs, newTab]);
      setActiveTabId(newTab.id);
    }
    setIsFilesView(false);
  };

  const handleDeleteFile = (id: string) => {
    const newFiles = savedFiles.filter((f) => f.id !== id);
    persistFiles(newFiles);
  };

  const handleDuplicateFile = (file: SavedFile) => {
    const newFile = {
      ...file,
      id: Date.now().toString(),
      title: `${file.title} (Copy)`,
      lastModified: Date.now(),
    };
    persistFiles([newFile, ...savedFiles]);
  };

  const handleToggleFilesView = () => {
    if (isFilesView) {
      // Going from Files -> Editor: if no tabs, create one
      if (tabs.length === 0) {
        handleNewEntry(); // This now opens the dialog
      } else {
        setIsFilesView(false);
      }
    } else {
      setIsFilesView(true);
    }
  };

  const showEditor = !isFilesView && hasActiveTab;

  // Helper to choose which preview component to render
  const renderPreview = (data: FormDataType, isExport = false) => {
    if (data.type === "course_plan") {
      return <CoursePlanPreview formData={data} isExport={isExport} />;
    }
    const receiptData = { ...data, receiptNo: data.receiptNo || "" };
    return <ReceiptPreview formData={receiptData} isExport={isExport} />;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f3f4f6] overflow-hidden">
      <TopBar
        tabs={tabs}
        activeTabId={activeTabId}
        isFilesView={isFilesView}
        onToggleFilesView={handleToggleFilesView}
        onTabChange={setActiveTabId}
        onTabClose={handleTabClose}
        onNewEntry={handleNewEntry}
      />

      {isFilesView || !showEditor ? (
        <FileExplorer
          files={savedFiles}
          onOpen={handleOpenFile}
          onDelete={handleDeleteFile}
          onDuplicate={handleDuplicateFile}
          onNewEntry={handleNewEntry}
          onDownload={handleDownloadFile}
        />
      ) : (
        <>
          <Ribbon
            data={activeTab!.data}
            onChange={updateActiveData}
            onSave={handleSaveRequest}
          />

          <div className="flex-1 relative overflow-hidden flex flex-col">
            <div className="absolute bottom-6 right-6 z-50 flex items-center gap-2 bg-[#2d2d2d] text-white px-3 py-1.5 rounded-full shadow-lg text-xs">
              <button
                onClick={() => updateZoom(zoom - 0.1)}
                className="hover:text-blue-300 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => updateZoom(zoom + 0.1)}
                className="hover:text-blue-300 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-gray-600 mx-1" />
              <button
                onClick={handleEditorExport}
                disabled={isExporting}
                className="flex items-center gap-1 hover:text-green-300 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? "Saving..." : "PDF"}
              </button>
            </div>

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-auto flex justify-center p-10 bg-[#e5e7eb]"
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                  transition: "transform 0.1s ease-out",
                  marginBottom: "50px",
                }}
                className="shadow-2xl"
              >
                <div className="w-[794px] h-[1123px] bg-white text-black relative">
                  {renderPreview(activeTab!.data)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hidden Render Target for PDF */}
      <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden h-0 w-0">
        <div ref={exportRef} className="w-[794px] h-[1123px] bg-white">
          {renderPreview(
            tempExportData || activeTab?.data || NEW_RECEIPT_TEMPLATE,
            true
          )}
        </div>
      </div>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the entry "{activeTab?.title || "Untitled"}" in
              your saved files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeSave}
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              Confirm Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isNewEntryDialogOpen}
        onOpenChange={(open) => setIsNewEntryDialogOpen(open)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Select the type of document you want to create.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex gap-4 py-4 justify-center">
            <button
              onClick={() => createEntry("receipt")}
              className="flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-xl transition-all w-32 h-32 group cursor-pointer"
            >
              <FileText className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-blue-700">
                Receipt
              </span>
            </button>

            <button
              onClick={() => createEntry("course_plan")}
              className="flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 rounded-xl transition-all w-32 h-32 group cursor-pointer"
            >
              <Calendar className="w-8 h-8 text-gray-400 group-hover:text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-purple-700">
                Course Plan
              </span>
            </button>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
