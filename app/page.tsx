"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Ribbon } from "@/components/layout/ribbon";
import { FileExplorer } from "@/components/file-explorer";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { CoursePlanPreview } from "@/components/receipt/course-plan-preview";
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

import {
  FormDataType,
  ReceiptTab,
  SavedFile,
  NEW_COURSE_PLAN_TEMPLATE,
  NEW_RECEIPT_TEMPLATE,
} from "@/types";
import { useFileSystem } from "@/hooks/use-filesystem";

const INITIAL_ZOOM = 1.1;
const INITIAL_SCROLL_TOP = 0;
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

export default function Home() {
  // --- Logic Hook ---
  const { savedFiles, saveFile, deleteFile, duplicateFile } = useFileSystem();

  // --- View State ---
  const [isFilesView, setIsFilesView] = useState(true);
  const [tabs, setTabs] = useState<ReceiptTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [isExporting, setIsExporting] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = useState(false);

  // For background PDF generation
  const [tempExportData, setTempExportData] = useState<FormDataType | null>(
    null
  );

  const exportRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Derived state
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeIndex = activeTab
    ? tabs.findIndex((t) => t.id === activeTabId)
    : -1;
  const hasActiveTab = !!activeTab && activeIndex !== -1;
  const showEditor = !isFilesView && hasActiveTab;

  // --- PDF Generation ---
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

  useEffect(() => {
    if (tempExportData && exportRef.current) {
      const timer = setTimeout(() => generatePdf(tempExportData, true), 100);
      return () => clearTimeout(timer);
    }
  }, [tempExportData]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          if (!isFilesView && hasActiveTab) setShowSaveConfirm(true);
        }
        if (e.key === "t") {
          e.preventDefault();
          setIsNewEntryDialogOpen(true);
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

  // --- Tab Management ---
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

  const executeSave = async () => {
    if (!hasActiveTab) return;

    const fileId = activeTab.savedFileId || crypto.randomUUID();
    const title =
      activeTab.data.studentName || activeTab.data.receiptNo || "Untitled";

    const newFile: SavedFile = {
      id: fileId,
      title,
      lastModified: Date.now(),
      data: activeTab.data,
    };

    await saveFile(newFile);

    const newTabs = [...tabs];
    newTabs[activeIndex].savedFileId = fileId;
    newTabs[activeIndex].title = title;
    setTabs(newTabs);
    setShowSaveConfirm(false);
  };

  const updateActiveData = (field: string | number | symbol, value: any) => {
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

  // --- Zoom & Scroll Logic ---
  const updateZoom = (newZoomVal: number) => {
    const clamped = Math.min(Math.max(0.3, newZoomVal), 2.5);
    setZoom(clamped);
    if (hasActiveTab && activeTab) activeTab.zoom = clamped;
  };

  useLayoutEffect(() => {
    if (hasActiveTab && !isFilesView) {
      setZoom(activeTab.zoom);
      setTimeout(() => {
        if (scrollContainerRef.current)
          scrollContainerRef.current.scrollTop = activeTab.scrollTop;
      }, 0);
    }
  }, [activeTabId, isFilesView]);

  // --- Trackpad pinch / ctrl+wheel zoom ---
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        const zoomStep = 0.008;
        const newZoom = Math.min(Math.max(0.3, zoom + delta * zoomStep), 2.5);

        setZoom(newZoom);
        if (hasActiveTab && activeTab) {
          activeTab.zoom = newZoom;
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [zoom, hasActiveTab, activeTab]);

  const renderPreview = (data: FormDataType, isExport = false) => {
    if (data.type === "course_plan") {
      return <CoursePlanPreview formData={data} isExport={isExport} />;
    }
    const receiptData = { ...data, receiptNo: data.receiptNo || "" };
    return <ReceiptPreview formData={receiptData} isExport={isExport} />;
  };

  // --- Render ---
  return (
    <div className="h-screen w-screen flex flex-col bg-[#f3f4f6] overflow-hidden">
      <TopBar
        tabs={tabs}
        activeTabId={activeTabId}
        isFilesView={isFilesView}
        onToggleFilesView={() => setIsFilesView(!isFilesView)}
        onTabChange={setActiveTabId}
        onTabClose={handleTabClose}
        onNewEntry={() => setIsNewEntryDialogOpen(true)}
      />

      {isFilesView || !showEditor ? (
        <FileExplorer
          files={savedFiles}
          onOpen={handleOpenFile}
          onDelete={deleteFile}
          onDuplicate={duplicateFile}
          onNewEntry={() => setIsNewEntryDialogOpen(true)}
          onDownload={(file) => setTempExportData(file.data)}
        />
      ) : (
        <>
          <Ribbon
            data={activeTab!.data}
            onChange={updateActiveData}
            onSave={() => setShowSaveConfirm(true)}
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
                onClick={() => generatePdf(activeTab!.data)}
                disabled={isExporting}
                className="flex items-center gap-1 hover:text-green-300 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? "Saving..." : "PDF"}
              </button>
            </div>

            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              onScroll={(e) => {
                if (hasActiveTab)
                  activeTab.scrollTop = e.currentTarget.scrollTop;
              }}
              className="flex-1 overflow-auto bg-[#e5e7eb]"
            >
              {/* 
                Inner Wrapper:
                - min-h-full ensures the container is at least the full height, 
                  so padding-bottom pushes against the bottom of the viewport.
                - flex & items-center handles centering of the content.
              */}
              <div className="min-h-full w-full flex flex-col items-center p-10">
                {/* 
                  Sizer Wrapper:
                  - Explicitly sets the layout size to match the zoom. 
                  - This forces the scrollbars to match the visual size.
                */}
                <div
                  style={{
                    width: PAGE_WIDTH * zoom,
                    height: PAGE_HEIGHT * zoom,
                    transition: "width 0.1s ease-out, height 0.1s ease-out",
                  }}
                  className="relative shrink-0 shadow-2xl bg-white"
                >
                  {/* 
                    Transformed Content:
                    - Uses top-left origin to fit perfectly into the sizer wrapper.
                  */}
                  <div
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "top left",
                      transition: "transform 0.1s ease-out",
                    }}
                    className="origin-top-left"
                  >
                    <div className="w-[794px] h-[1123px] bg-white text-black">
                      {renderPreview(activeTab!.data)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hidden PDF Target */}
      <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden h-0 w-0">
        <div ref={exportRef} className="w-[794px] h-[1123px] bg-white">
          {renderPreview(
            tempExportData || activeTab?.data || NEW_RECEIPT_TEMPLATE,
            true
          )}
        </div>
      </div>

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the entry "{activeTab?.title || "Untitled"}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirm Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isNewEntryDialogOpen}
        onOpenChange={setIsNewEntryDialogOpen}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Select document type.
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
