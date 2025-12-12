"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Grid,
  List,
  Trash2,
  Copy,
  FileText,
  Plus,
  Calendar,
  X,
  LayoutGrid,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input as TextInput } from "@/components/ui/input";
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

import {
  FormDataType,
  ReceiptTab,
  SavedFile,
  NEW_COURSE_PLAN_TEMPLATE,
  NEW_RECEIPT_TEMPLATE,
} from "@/types";

import { DocumentEditor } from "@/components/document-editor";

export interface Tab {
  id: string;
  title: string;
}

interface TopBarProps {
  tabs: Tab[];
  activeTabId: string;
  isFilesView: boolean;
  onToggleFilesView: () => void;
  onTabChange: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewEntry: () => void;
}

const tabBaseClasses =
  "relative flex items-center h-8 px-3 rounded-t-md text-xs cursor-pointer transition-colors border-t border-x border-transparent select-none";
const tabActiveClasses =
  "bg-[#f3f4f6] text-black font-medium shadow-sm !border-gray-300/50";
const tabInactiveClasses =
  "bg-[#2d2d2d] text-gray-400 hover:bg-[#3d3d3d] hover:text-gray-200";

function TopBar({
  tabs,
  activeTabId,
  isFilesView,
  onToggleFilesView,
  onTabChange,
  onTabClose,
  onNewEntry,
}: TopBarProps) {
  return (
    <header className="h-10 bg-[#1b1b1b] flex items-end px-4 gap-4 select-none z-50">
      <div className="flex items-center h-full pb-0.5">
        <span className="text-white font-medium text-sm tracking-wide">
          Siuroma Kids Entry Manager
        </span>
      </div>

      <div className="h-5 w-px bg-gray-700 mb-2.5" />

      <div className="flex-1 flex items-end h-full overflow-x-auto no-scrollbar gap-1">
        <div
          onClick={() => !isFilesView && onToggleFilesView()}
          className={`${tabBaseClasses} min-w-[110px] gap-2 ${
            isFilesView ? tabActiveClasses : tabInactiveClasses
          }`}
          title="File Explorer"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Explorer</span>
        </div>

        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId && !isFilesView;
          return (
            <div
              key={tab.id}
              onClick={() => {
                if (isFilesView) onToggleFilesView();
                onTabChange(tab.id);
              }}
              className={`group justify-between min-w-[140px] max-w-[200px] ${tabBaseClasses} ${
                isActive ? tabActiveClasses : tabInactiveClasses
              }`}
            >
              <span className="truncate mr-2">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className={`p-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-all cursor-pointer ${
                  isActive ? "text-gray-600" : "text-gray-400"
                }`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        <button
          onClick={onNewEntry}
          className="h-8 w-8 flex items-center justify-center rounded-t-md hover:bg-[#3d3d3d] text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="New Entry"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

function useFileSystem() {
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);

  const persistFiles = useCallback((files: SavedFile[]) => {
    setSavedFiles(files);
    if (typeof window !== "undefined") {
      localStorage.setItem("rc_saved_files", JSON.stringify(files));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("rc_saved_files");
      if (stored) {
        try {
          setSavedFiles(JSON.parse(stored));
        } catch (e) {
          console.error("Local load failed", e);
        }
      }
    }

    const fetchFromFirestore = async () => {
      try {
        const q = query(
          collection(db, "entries"),
          orderBy("lastModified", "desc")
        );
        const snap = await getDocs(q);
        const files: SavedFile[] = snap.docs.map((d) => {
          const data = d.data() as Omit<SavedFile, "id">;
          return { id: d.id, ...data };
        });
        persistFiles(files);
      } catch (e) {
        console.error("Firestore load failed", e);
      }
    };

    fetchFromFirestore();
  }, [persistFiles]);

  const saveFile = useCallback(
    async (file: SavedFile) => {
      const existingIdx = savedFiles.findIndex((f) => f.id === file.id);
      const newFileList = [...savedFiles];

      if (existingIdx >= 0) newFileList[existingIdx] = file;
      else newFileList.unshift(file);

      persistFiles(newFileList);

      try {
        await setDoc(doc(collection(db, "entries"), file.id), {
          title: file.title,
          lastModified: file.lastModified,
          data: file.data,
        });
      } catch (e) {
        console.error("Firestore save failed", e);
      }
    },
    [savedFiles, persistFiles]
  );

  const deleteFile = useCallback(
    async (id: string) => {
      const newFiles = savedFiles.filter((f) => f.id !== id);
      persistFiles(newFiles);

      try {
        await deleteDoc(doc(db, "entries", id));
      } catch (e) {
        console.error("Failed to delete from Firestore", e);
      }
    },
    [savedFiles, persistFiles]
  );

  const duplicateFile = useCallback(
    async (file: SavedFile) => {
      const newId = crypto.randomUUID();
      const newFile: SavedFile = {
        ...file,
        id: newId,
        title: `${file.title} (Copy)`,
        lastModified: Date.now(),
        data: { ...file.data },
      };
      await saveFile(newFile);
    },
    [saveFile]
  );

  return { savedFiles, saveFile, deleteFile, duplicateFile };
}

interface FileExplorerProps {
  files: SavedFile[];
  onOpen: (file: SavedFile) => void;
  onDelete: (id: string) => void;
  onDuplicate: (file: SavedFile) => void;
  onNewEntry: () => void;
  onDownload: (file: SavedFile) => void;
}

function FileExplorer({
  files,
  onOpen,
  onDelete,
  onDuplicate,
  onNewEntry,
  onDownload,
}: FileExplorerProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  const filteredFiles = useMemo(() => {
    const q = search.toLowerCase();
    return files.filter((f) => {
      const receiptNo = f.data.receiptNo || "";
      const courseCode = f.data.courseCode || "";
      return (
        f.title.toLowerCase().includes(q) ||
        courseCode.toLowerCase().includes(q) ||
        receiptNo.toLowerCase().includes(q)
      );
    });
  }, [files, search]);

  return (
    <div className="flex-1 bg-[#f3f4f6] p-8 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
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
              <TextInput
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

const getTypeColor = (type?: string) =>
  type === "course_plan"
    ? "bg-purple-100 text-purple-700"
    : "bg-blue-100 text-blue-700";

const TypeIcon = ({ type, className }: { type?: string; className?: string }) =>
  type === "course_plan" ? (
    <Calendar className={className} />
  ) : (
    <FileText className={className} />
  );

function FileCard({
  file,
  onOpen,
  onDelete,
  onDuplicate,
  onDownload,
}: {
  file: SavedFile;
  onOpen: (file: SavedFile) => void;
  onDelete: (id: string) => void;
  onDuplicate: (file: SavedFile) => void;
  onDownload: (file: SavedFile) => void;
}) {
  const isPlan = file.data.type === "course_plan";

  return (
    <div className="group relative bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
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
            {Array.from({ length: 6 }).map((_, i) => (
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

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase">
            {file.data.courseCode || "NO COURSE CODE"}
          </span>
          <span>{new Date(file.lastModified).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
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

function FileRow({
  file,
  onOpen,
  onDelete,
  onDuplicate,
  onDownload,
}: {
  file: SavedFile;
  onOpen: (file: SavedFile) => void;
  onDelete: (id: string) => void;
  onDuplicate: (file: SavedFile) => void;
  onDownload: (file: SavedFile) => void;
}) {
  const isPlan = file.data.type === "course_plan";

  return (
    <div className="flex items-center p-3 hover:bg-gray-50 group">
      <div
        onClick={() => onOpen(file)}
        className="flex-1 flex items-center gap-4 cursor-pointer"
      >
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

        <div className="ml-auto">
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
            {file.data.courseCode || "NO COURSE CODE"}
          </span>
        </div>
      </div>

      <div className="hidden group-hover:flex gap-2 ml-4">
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

interface EntriesWorkspaceProps {
  ReceiptContent: React.ComponentType;
  CoursePlanContent: React.ComponentType;
}

const WORKSPACE_STATE_KEY = "rc_workspace_state_v1";

export function EntriesWorkspace({
  ReceiptContent,
  CoursePlanContent,
}: EntriesWorkspaceProps) {
  const { savedFiles, saveFile, deleteFile, duplicateFile } = useFileSystem();

  const [isFilesView, setIsFilesView] = useState(true);
  const [tabs, setTabs] = useState<ReceiptTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = useState(false);
  const [pendingExportTabId, setPendingExportTabId] = useState<string | null>(
    null
  );

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;
  const activeIndex = activeTab
    ? tabs.findIndex((t) => t.id === activeTabId)
    : -1;
  const hasActiveTab = !!activeTab && activeIndex !== -1;
  const showEditor = !isFilesView && hasActiveTab;

  const derivedTabs = useMemo(
    () =>
      tabs.map((tab) => {
        if (tab.id !== activeTabId) return tab;
        const d: any = tab.data;
        const liveTitle = d?.studentName || d?.receiptNo || tab.title;
        return { ...tab, title: liveTitle };
      }),
    [tabs, activeTabId]
  );

  // Load workspace state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(WORKSPACE_STATE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        tabs?: ReceiptTab[];
        activeTabId?: string;
        isFilesView?: boolean;
      };

      if (parsed.tabs && Array.isArray(parsed.tabs)) setTabs(parsed.tabs);
      if (typeof parsed.activeTabId === "string")
        setActiveTabId(parsed.activeTabId);
      if (typeof parsed.isFilesView === "boolean")
        setIsFilesView(parsed.isFilesView);
    } catch (e) {
      console.error("Failed to load workspace state", e);
    }
  }, []);

  // Persist workspace state
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const payload = JSON.stringify({ tabs, activeTabId, isFilesView });
      localStorage.setItem(WORKSPACE_STATE_KEY, payload);
    } catch (e) {
      console.error("Failed to save workspace state", e);
    }
  }, [tabs, activeTabId, isFilesView]);

  const handleTabClose = useCallback(
    (id: string) => {
      if (tabs.length === 1) {
        setTabs([]);
        setActiveTabId("");
        setIsFilesView(true);
        setPendingExportTabId(null);
        return;
      }
      const newTabs = tabs.filter((t) => t.id !== id);
      setTabs(newTabs);
      if (activeTabId === id && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      if (pendingExportTabId === id) setPendingExportTabId(null);
    },
    [tabs, activeTabId, pendingExportTabId]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;

      if (e.key === "s") {
        e.preventDefault();
        if (!isFilesView && hasActiveTab) setShowSaveConfirm(true);
      } else if (e.key === "t") {
        e.preventDefault();
        setIsNewEntryDialogOpen(true);
      } else if (e.key === "w") {
        e.preventDefault();
        if (!isFilesView && hasActiveTab) handleTabClose(activeTabId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTabId, isFilesView, hasActiveTab, handleTabClose]);

  const createEntry = (type: "receipt" | "course_plan") => {
    const newId = Date.now().toString();
    const template =
      type === "course_plan"
        ? { ...NEW_COURSE_PLAN_TEMPLATE }
        : { ...NEW_RECEIPT_TEMPLATE };

    const newTab: ReceiptTab = {
      id: newId,
      title: `Untitled ${tabs.length + 1}`,
      data: template as FormDataType,
      zoom: 1,
      scrollTop: 0,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setIsFilesView(false);
    setIsNewEntryDialogOpen(false);
  };

  const createTabFromFile = (file: SavedFile, id: string): ReceiptTab => ({
    id,
    title: file.title,
    data: file.data as FormDataType,
    savedFileId: file.id,
    zoom: 1,
    scrollTop: 0,
  });

  const handleOpenFile = (file: SavedFile) => {
    const openTab = tabs.find((t) => t.savedFileId === file.id);
    if (openTab) {
      setActiveTabId(openTab.id);
    } else {
      const newId = Date.now().toString();
      const newTab = createTabFromFile(file, newId);
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newId);
    }
    setIsFilesView(false);
  };

  const executeSave = async () => {
    if (!hasActiveTab || !activeTab) return;

    const fileId = activeTab.savedFileId || crypto.randomUUID();
    const d: any = activeTab.data;
    const baseTitle = d?.studentName || d?.receiptNo || activeTab.title;

    const newFile: SavedFile = {
      id: fileId,
      title: baseTitle,
      lastModified: Date.now(),
      data: activeTab.data,
    };

    await saveFile(newFile);

    const newTabs = [...tabs];
    newTabs[activeIndex] = {
      ...newTabs[activeIndex],
      savedFileId: fileId,
      title: baseTitle,
    };
    setTabs(newTabs);
    setShowSaveConfirm(false);
  };

  const handleDownloadFromExplorer = (file: SavedFile) => {
    const existingTab = tabs.find((t) => t.savedFileId === file.id);

    if (existingTab) {
      setActiveTabId(existingTab.id);
      setIsFilesView(false);
      setPendingExportTabId(existingTab.id);
    } else {
      const newTabId = Date.now().toString();
      const newTab = createTabFromFile(file, newTabId);
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTabId);
      setIsFilesView(false);
      setPendingExportTabId(newTabId);
    }
  };

  // ✅ Stable editor change handler (no stale closure)
  const handleEditorChange = useCallback(
    (tabId: string, nextData: FormDataType) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === tabId);
        if (idx === -1) return prev;

        if (prev[idx].data === nextData) return prev;

        const copy = [...prev];
        copy[idx] = { ...copy[idx], data: nextData };
        return copy;
      });
    },
    []
  );

  const renderEditor = () => {
    if (!activeTab) return null;
    const isCoursePlan = activeTab.data.type === "course_plan";

    const shouldAutoExport = activeTab.id === pendingExportTabId;
    const d: any = activeTab.data;
    const autoExportToken = shouldAutoExport
      ? `${activeTab.id}-${d?.receiptNo || ""}-${d?.studentName || ""}`
      : undefined;

    return (
      <DocumentEditor
        key={activeTab.id}
        initialData={activeTab.data}
        title={isCoursePlan ? "Course Plan" : "Receipt"}
        onChange={(next) => handleEditorChange(activeTab.id, next)}
        onSaveClick={() => setShowSaveConfirm(true)}
        autoExportToken={autoExportToken}
        onExportDone={() => setPendingExportTabId(null)}
      >
        {isCoursePlan ? <CoursePlanContent /> : <ReceiptContent />}
      </DocumentEditor>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f3f4f6] overflow-hidden">
      <TopBar
        tabs={derivedTabs}
        activeTabId={activeTabId}
        isFilesView={isFilesView}
        onToggleFilesView={() => setIsFilesView((v) => !v)}
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
          onDownload={handleDownloadFromExplorer}
        />
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          {renderEditor()}
        </div>
      )}

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

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the entry "{activeTab?.title || "Untitled"}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirm Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
