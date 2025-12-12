"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Save,
  Loader2,
  Download,
  ChevronDown,
  FileWarning,
  X,
  Check,
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import logo from "@/assets/logo.png";
import { FormDataType } from "@/types";

// --- FIREBASE INTEGRATION ---
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

// --- DATE FORMATTING HELPER ---
const formatLessonDate = (dateStr: string, timeSlot?: string) => {
  let timePart = "00:00";
  if (timeSlot) {
    const match = timeSlot.match(/(\d{2}:\d{2})/);
    if (match) timePart = match[1];
  }
  return `${dateStr}T${timePart}`;
};

interface FieldMeta {
  name: string;
  label?: string;
  type?: string;
  width?: string;
  options?: Array<string | { label: string; value: string }>;
}

interface DocContextType {
  data: FormDataType;
  setData: React.Dispatch<React.SetStateAction<FormDataType>>;
  updateField: (field: keyof FormDataType, value: any) => void;
  isExporting: boolean;
  registerField: (meta: FieldMeta) => void;
  unregisterField: (name: string) => void;
  initialData: FormDataType;
}

const DocumentContext = createContext<DocContextType | null>(null);

export function useDoc() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDoc must be used within DocumentEditor");
  return ctx;
}

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PAGE_PADDING = 48;
const MEASURE_WIDTH = 698;
const PAGE_CONTENT_MAX_HEIGHT = 1027;

const formatDisplayDate = (val: string) => {
  if (!val) return "";

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (val.includes("T")) {
    const [datePart, timePart] = val.split("T");
    const [year, month, day] = datePart.split("-");
    const [hours, minutes] = timePart.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    const dayNum = parseInt(day, 10);
    const suffix =
      dayNum % 10 === 1 && dayNum !== 11
        ? "st"
        : dayNum % 10 === 2 && dayNum !== 12
        ? "nd"
        : dayNum % 10 === 3 && dayNum !== 13
        ? "rd"
        : "th";

    const monthName = monthNames[parseInt(month, 10) - 1];
    return `${dayNum}${suffix} ${monthName} ${year}, ${displayHour}:${minutes} ${period}`;
  }

  if (val.includes("-")) {
    const [year, month, day] = val.split("-");
    const dayNum = parseInt(day, 10);
    const suffix =
      dayNum % 10 === 1 && dayNum !== 11
        ? "st"
        : dayNum % 10 === 2 && dayNum !== 12
        ? "nd"
        : dayNum % 10 === 3 && dayNum !== 13
        ? "rd"
        : "th";

    const monthName = monthNames[parseInt(month, 10) - 1];
    return `${dayNum}${suffix} ${monthName} ${year}`;
  }

  return val;
};

export function Input({
  name,
  label,
  type = "text",
  width = "w-32",
  className = "",
  options = [],
}: FieldMeta & {
  className?: string;
  placeholder?: string;
}) {
  const { data, registerField, unregisterField } = useDoc();

  useEffect(() => {
    // Register field WITH options so Ribbon knows about them
    registerField({ name, label, type, width, options });
    return () => unregisterField(name);
  }, [name, label, type, width, options, registerField, unregisterField]);

  const displayValue = useMemo(() => {
    const rawValue = (data as any)[name] || "";

    // If dropdown, show the LABEL instead of value
    if (type === "dropdown" || type === "select") {
      const selectedOption = options.find((opt) => {
        if (typeof opt === "string") return opt === rawValue;
        return opt.value === rawValue;
      });

      if (selectedOption) {
        return typeof selectedOption === "string"
          ? selectedOption
          : selectedOption.label;
      }
    }

    if (type === "date" || type === "datetime-local") {
      return formatDisplayDate(rawValue);
    }
    return rawValue;
  }, [data, name, type, options]);

  const isChinese = useMemo(
    () => /[\u4e00-\u9fff]/.test(displayValue),
    [displayValue]
  );

  return (
    <span
      className={`${className} ${
        isChinese ? "font-noto-sans-tc" : ""
      } text-right`}
    >
      {displayValue || "..."}
    </span>
  );
}

// --- EDITING TYPES & COMPONENTS ---

interface EditingState {
  index: number;
  field: "name" | "dateTime";
  value: string;
  top: number;
  left: number;
}

const LessonEditPopover = ({
  state,
  onSave,
  onCancel,
}: {
  state: EditingState;
  onSave: (val: string) => void;
  onCancel: () => void;
}) => {
  const [val, setVal] = useState(state.value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  return (
    <div
      className="fixed z-50 bg-white shadow-xl border border-gray-200 rounded-lg p-3 flex flex-col gap-2 min-w-[280px] animate-in fade-in zoom-in-95 duration-100"
      style={{
        top: Math.min(state.top + 20, window.innerHeight - 150),
        left: Math.min(state.left, window.innerWidth - 300),
      }}
    >
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        Edit {state.field === "dateTime" ? "Date & Time" : "Lesson Title"}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type={state.field === "dateTime" ? "datetime-local" : "text"}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave(val);
            if (e.key === "Escape") onCancel();
          }}
          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 cursor-text"
        />
        <button
          onClick={() => onSave(val)}
          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={onCancel}
          className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface DocumentEditorProps {
  initialData: FormDataType;
  title: string;
  children: ReactNode;
  onChange?: (data: FormDataType) => void;
  onSaveClick?: () => void;
  autoExportToken?: string | number;
  onExportDone?: () => void;
}

export function DocumentEditor({
  initialData,
  title,
  children,
  onChange,
  onSaveClick,
  autoExportToken,
  onExportDone,
}: DocumentEditorProps) {
  const initialDataRef = useRef<FormDataType>(
    initialData && Object.keys(initialData).length > 0
      ? initialData
      : ({} as FormDataType)
  );

  const [data, setData] = useState<FormDataType>(initialDataRef.current);
  const [isExporting, setIsExporting] = useState(false);
  const [fields, setFields] = useState<FieldMeta[]>([]);
  const [pages, setPages] = useState<ReactNode[][]>([]);

  // Editing State
  const [editingLesson, setEditingLesson] = useState<EditingState | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  const handleSaveClick = onSaveClick ?? (() => {});

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const isFirstDataRender = useRef(true);
  useEffect(() => {
    if (isFirstDataRender.current) {
      isFirstDataRender.current = false;
      return;
    }
    onChangeRef.current?.(data);
  }, [data]);

  const updateField = useCallback((field: keyof FormDataType, val: any) => {
    setData((prev) => {
      if ((prev as any)[field] === val) return prev;
      return { ...prev, [field]: val };
    });
  }, []);

  const registerField = useCallback((meta: FieldMeta) => {
    setFields((prev) => {
      // Update if exists (to capture options prop changes), otherwise add
      const exists = prev.findIndex((f) => f.name === meta.name);
      if (exists !== -1) {
        // Only update if options or type changed
        if (JSON.stringify(prev[exists]) !== JSON.stringify(meta)) {
          const newFields = [...prev];
          newFields[exists] = meta;
          return newFields;
        }
        return prev;
      }
      return [...prev, meta];
    });
  }, []);

  const unregisterField = useCallback((name: string) => {
    setFields((prev) => prev.filter((f) => f.name !== name));
  }, []);

  // --- PAGINATION ---
  useEffect(() => {
    const runPagination = () => {
      if (!contentRef.current) return;
      const container = contentRef.current;
      const elements = Array.from(container.children) as HTMLElement[];
      let currentPageNodes: ReactNode[] = [];
      let currentHeight = 0;
      const newPages: ReactNode[][] = [];

      elements.forEach((el, index) => {
        const style = window.getComputedStyle(el);
        const marginBottom = parseInt(style.marginBottom || "0", 10);
        const totalElementSpace = el.offsetHeight + marginBottom;

        if (currentHeight + totalElementSpace > PAGE_CONTENT_MAX_HEIGHT) {
          if (currentPageNodes.length > 0) {
            newPages.push(currentPageNodes);
            currentPageNodes = [];
            currentHeight = 0;
          }
        }

        if (index === 0) {
          currentPageNodes.push(<Header key="static-header" />);
        } else {
          currentPageNodes.push(
            <div
              key={`node-${index}`}
              dangerouslySetInnerHTML={{ __html: el.outerHTML }}
              className="w-full"
            />
          );
        }

        currentHeight += totalElementSpace;
      });

      if (currentPageNodes.length > 0) newPages.push(currentPageNodes);
      if (newPages.length === 0) newPages.push([]);
      setPages(newPages);
    };

    const timer = setTimeout(runPagination, 300);
    return () => clearTimeout(timer);
  }, [children, data]);

  // --- EDITING HANDLERS ---
  const handlePageClick = (e: React.MouseEvent) => {
    if (isExporting) return;

    const target = (e.target as HTMLElement).closest("[data-edit-type]");
    if (!target) return;

    const type = target.getAttribute("data-edit-type");
    const indexStr = target.getAttribute("data-index");
    const index = parseInt(indexStr || "0", 10);
    const rect = target.getBoundingClientRect();

    const currentLessons = (data as any).lessons || [];
    const lesson = currentLessons[index];

    if (!lesson) return;

    if (type === "lesson-name") {
      setEditingLesson({
        index,
        field: "name",
        value: lesson.name,
        top: rect.bottom,
        left: rect.left,
      });
    } else if (type === "lesson-date") {
      setEditingLesson({
        index,
        field: "dateTime",
        value: lesson.dateTime || "",
        top: rect.bottom,
        left: rect.left,
      });
    }
  };

  const saveEdit = (newValue: string) => {
    if (!editingLesson) return;

    const currentLessons = [...((data as any).lessons || [])];
    currentLessons[editingLesson.index] = {
      ...currentLessons[editingLesson.index],
      [editingLesson.field]: newValue,
    };

    updateField("lessons", currentLessons);
    setEditingLesson(null);
  };

  // --- EXPORT ---
  const generatePdf = useCallback(async () => {
    if (!pagesContainerRef.current) return;
    const pageElements =
      pagesContainerRef.current.querySelectorAll(".pdf-page-content");

    if (!pageElements.length) {
      console.warn("No .pdf-page-content elements found");
      return;
    }

    setIsExporting(true);
    setEditingLesson(null);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [PAGE_WIDTH, PAGE_HEIGHT],
      });

      for (let i = 0; i < pageElements.length; i++) {
        const pageElement = pageElements[i] as HTMLElement;

        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: -window.scrollY,
          windowWidth: pageElement.scrollWidth,
          windowHeight: pageElement.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      const timestamp = new Date().toISOString().split("T")[0];
      const keyField =
        (data as any).receiptNo || (data as any).studentName || "doc";
      const filename = `${title}-${keyField}-${timestamp}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Export failed. Please check console.");
    } finally {
      setIsExporting(false);
      onExportDone?.();
    }
  }, [title, data, onExportDone]);

  useEffect(() => {
    if (!autoExportToken) return;
    if (!pagesContainerRef.current) return;
    if (pages.length === 0) return;
    const id = window.setTimeout(() => {
      generatePdf();
    }, 0);
    return () => window.clearTimeout(id);
  }, [autoExportToken, pages, generatePdf]);

  const contextValue = useMemo(
    () => ({
      data,
      setData,
      updateField,
      isExporting,
      registerField,
      unregisterField,
      initialData: initialDataRef.current,
    }),
    [data, updateField, isExporting, registerField, unregisterField]
  );

  return (
    <DocumentContext.Provider value={contextValue}>
      <div className="flex flex-col min-h-screen bg-gray-100 font-sans text-[#111]">
        {/* Editor Popover */}
        {editingLesson && (
          <LessonEditPopover
            state={editingLesson}
            onSave={saveEdit}
            onCancel={() => setEditingLesson(null)}
          />
        )}

        {/* TOP RIBBON */}
        <div className="top-0 z-20 bg-white px-6 py-3 flex items-center gap-4 min-h-16 shrink-0 shadow-md relative">
          <RibbonAction icon={Save} label="Save" onClick={handleSaveClick} />
          <RibbonAction
            icon={isExporting ? Loader2 : Download}
            label="PDF"
            onClick={generatePdf}
            disabled={isExporting}
            spin={isExporting}
          />
          <div className="w-px h-10 bg-gray-200 mx-2 shrink-0" />
          <div className="flex items-center gap-4 overflow-x-visible overflow-y-visible">
            {fields.map((field) => (
              <RibbonField key={field.name} {...field} />
            ))}
          </div>
        </div>

        {/* HIDDEN CONTENT FOR PAGINATION CALCULATION */}
        <div
          ref={contentRef}
          style={{
            position: "absolute",
            left: "-9999px",
            width: `${MEASURE_WIDTH}px`,
          }}
          className="invisible"
        >
          <Header />
          {children}
        </div>

        {/* VISIBLE PAGES */}
        <div className="flex-1 overflow-auto py-10 pb-20 flex flex-col items-center gap-8">
          <div
            ref={pagesContainerRef}
            onClick={handlePageClick}
            className="flex flex-col gap-8"
          >
            {pages.map((pageContent, i) => (
              <div
                key={`page-${i}`}
                className="pdf-page-content bg-white shadow-xl"
                style={{
                  width: `${PAGE_WIDTH}px`,
                  height: `${PAGE_HEIGHT}px`,
                  padding: `${PAGE_PADDING}px`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1">{pageContent}</div>
                  <div className="absolute bottom-6 right-8 text-[10px] text-gray-400">
                    Page {i + 1} / {pages.length}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DocumentContext.Provider>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <h2 className="font-bold text-base mb-2 border-b border-gray-300 pb-1">
        {title}
      </h2>
      {children}
    </div>
  );
}

export const Stack = ({ children }: { children: ReactNode }) => (
  <div className="space-y-1 text-sm">{children}</div>
);

export const Grid2Col = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-2 gap-4 mb-2">{children}</div>
);

export const Title = ({ children }: { children: ReactNode }) => (
  <h1 className="text-4xl font-semibold text-center">{children}</h1>
);

export function InfoRow({
  label,
  children,
  bold,
  strikethrough,
}: {
  label?: string;
  children: ReactNode;
  bold?: boolean;
  strikethrough?: boolean;
}) {
  if (!label) return <div>{children}</div>;
  return (
    <div className={`flex gap-2 ${bold ? "font-semibold" : ""}`}>
      <span className="min-w-30">{label}:</span>
      <span className="flex-1">
        {strikethrough ? (
          <>
            <span className="line-through text-gray-400 mr-2">{children}</span>
            <span>(Waived)</span>
          </>
        ) : (
          <span>{children}</span>
        )}
      </span>
    </div>
  );
}

export function LessonList({
  fieldName = "lessons",
  lessonsOverride,
  startIndex = 0,
}: {
  fieldName?: string;
  lessonsOverride?: any[];
  startIndex?: number;
}) {
  const { data } = useDoc();
  const lessons = lessonsOverride ?? (data as any)[fieldName] ?? [];
  if (lessons.length === 0) return null;

  const isEditable = !lessonsOverride;

  return (
    <div className="mt-2 flex">
      <div className="text-sm min-w-32">Lesson Schedule:</div>
      <div className="columns-1 md:columns-2 gap-8 space-y-2">
        {lessons.map((lesson: any, index: number) => {
          const lessonNumber = startIndex + index + 1;
          const editPropsName = isEditable
            ? {
                "data-edit-type": "lesson-name",
                "data-index": index,
                className:
                  "font-medium flex text-sm cursor-pointer hover:text-blue-600 hover:underline decoration-blue-300 decoration-dotted underline-offset-2 transition-colors",
                title: "Click to edit title",
              }
            : { className: "font-medium flex text-sm" };

          const editPropsDate = isEditable
            ? {
                "data-edit-type": "lesson-date",
                "data-index": index,
                className:
                  "text-gray-600 whitespace-nowrap text-sm cursor-pointer hover:text-blue-600 hover:underline decoration-blue-300 decoration-dotted underline-offset-2 transition-colors",
                title: "Click to edit date/time",
              }
            : { className: "text-gray-600 whitespace-nowrap text-sm" };

          return (
            <div
              key={`lesson-${lessonNumber}`}
              className="flex items-center gap-4 break-inside-avoid"
            >
              <span className="text-gray-300 min-w-10 text-3xl -mr-2">
                {lessonNumber.toString().padStart(2, "0")}
              </span>
              <div className="flex-col">
                <span {...editPropsName}>{lesson.name}</span>
                <span {...editPropsDate}>
                  {lesson.dateTime ? formatDisplayDate(lesson.dateTime) : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Header = React.memo(() => (
  <div className="flex w-full justify-between items-start mb-8 shrink-0">
    <img
      src={logo.src}
      alt="Logo"
      className="h-22 w-auto object-contain"
      crossOrigin="anonymous"
    />
    <div className="flex flex-col text-[10px] text-neutral-600">
      <p className="font-medium text-neutral-900 mb-0.5">
        Unicorn Vision Design Limited
      </p>
      <p>No.903, 1202, Vogue Centre,</p>
      <p>696 Castle Peak Road,</p>
      <p>KL, HK</p>
      <div className="flex justify-between mt-0.5 text-[9px]">
        <span>Tel: 3168 6878</span>
        <span>Fax: 3168 6879</span>
      </div>
    </div>
  </div>
));
Header.displayName = "Header";

interface RibbonActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  spin?: boolean;
}

const RibbonAction = ({
  icon: Icon,
  label,
  onClick,
  disabled,
  spin,
}: RibbonActionProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex flex-col items-center gap-1 p-2 min-w-[50px] text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
  >
    <Icon className={`w-5 h-5 ${spin ? "animate-spin" : ""}`} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const CourseAutocomplete = ({
  name,
  label,
  width,
}: {
  name: string;
  label?: string;
  width?: string;
}) => {
  const { data, updateField } = useDoc();
  const [inputValue, setInputValue] = useState((data as any)[name] || "");
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCourseCodes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        const codes = querySnapshot.docs.map((doc) => doc.id);
        setCourseOptions(codes);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourseCodes();
  }, []);

  useEffect(() => {
    setInputValue((data as any)[name] || "");
  }, [(data as any)[name], name]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    updateField(name as keyof FormDataType, val);
    setShowSuggestions(true);
  };

  const handleSelectCourse = async (code: string) => {
    setShowSuggestions(false);
    setIsLoadingCourse(true);

    setInputValue(code);
    updateField(name as keyof FormDataType, code);

    try {
      const docRef = doc(db, "courses", code);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const firebaseLessons = (data as any).lessons || [];
        const timeSlot = (data as any).timeSlot || "";

        const mappedLessons = firebaseLessons.map((l: any) => ({
          name: l.name,
          dateTime: formatLessonDate(l.dateStr, timeSlot),
        }));

        updateField("lessons", mappedLessons);
      } else {
        console.warn("No such document in Firestore!");
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
    } finally {
      setIsLoadingCourse(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = courseOptions.filter((code) =>
    code.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div
      ref={wrapperRef}
      className="relative flex flex-col gap-1 shrink-0 z-50"
    >
      {label && (
        <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold truncate max-w-[120px]">
          {label}
        </span>
      )}
      <div className="relative">
        <input
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={label || name}
          autoComplete="off"
          className={`h-8 rounded border border-gray-200 bg-gray-50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
            width || "w-32"
          }`}
        />
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((code) => (
              <button
                key={code}
                onClick={() => handleSelectCourse(code)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-gray-700 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="font-bold text-blue-600">{code}</div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-gray-400 flex items-center gap-2">
              <FileWarning className="w-3 h-3" /> No courses found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- UPDATED RIBBON FIELD ---

const RibbonField = ({ label, name, width, type, options }: FieldMeta) => {
  const { data, updateField } = useDoc();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateField(name as keyof FormDataType, e.target.value);
    },
    [name, updateField]
  );

  if (name === "courseCode") {
    return <CourseAutocomplete name={name} label={label} width={width} />;
  }

  // 1. Logic to render a Dropdown
  if (type === "dropdown" || type === "select") {
    return (
      <div className="flex flex-col gap-1 shrink-0">
        {label && (
          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold truncate max-w-[120px]">
            {label}
          </span>
        )}
        <div className="relative">
          <select
            value={(data as any)[name] || ""}
            onChange={handleChange}
            className={`h-8 rounded border border-gray-200 bg-gray-50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none pr-6 cursor-pointer ${
              width || "w-32"
            }`}
          >
            <option value="" disabled>
              Select...
            </option>
            {options?.map((opt) => {
              const val = typeof opt === "string" ? opt : opt.value;
              const lbl = typeof opt === "string" ? opt : opt.label;
              return (
                <option key={val} value={val}>
                  {lbl}
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
      </div>
    );
  }

  // 2. Default Input rendering
  return (
    <div className="flex flex-col gap-1 shrink-0">
      {label && (
        <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold truncate max-w-[120px]">
          {label}
        </span>
      )}
      <input
        value={(data as any)[name] || ""}
        onChange={handleChange}
        type={type}
        placeholder={label || name}
        className={`h-8 rounded border border-gray-200 bg-gray-50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-text ${
          width || "w-32"
        }`}
      />
    </div>
  );
};
