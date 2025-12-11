"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Save, Loader2 } from "lucide-react";
import { FormDataType } from "@/app/page"; // Ensure this path matches your project
import { db } from "@/lib/firebase"; // Ensure this matches your firebase config path
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

interface RibbonProps {
  data: FormDataType;
  onChange: (field: keyof FormDataType, value: any) => void;
  onSave: () => void;
}

// Helper to format date + timeSlot into datetime-local string
const formatLessonDate = (dateStr: string, timeSlot?: string) => {
  let timePart = "00:00";
  // Extract time like "14:00" from "SAT 14:00 - 16:00"
  if (timeSlot) {
    const match = timeSlot.match(/(\d{2}:\d{2})/);
    if (match) timePart = match[1];
  }
  // Return YYYY-MM-DDTHH:MM
  return `${dateStr}T${timePart}`;
};

export function Ribbon({ data, onChange, onSave }: RibbonProps) {
  const isCoursePlan = data.type === "course_plan";

  // State for autocomplete
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);

  // 1. Fetch all course IDs (e.g. SPEC_C001) on mount for the autocomplete list
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        const codes = querySnapshot.docs.map((d) => d.id);
        setAvailableCourses(codes);
      } catch (e) {
        console.error("Failed to load course list", e);
      }
    };
    fetchCourses();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onChange(name as keyof FormDataType, value);

    // 2. Trigger course load if the input is Course Code and matches a valid ID
    if (name === "courseCode") {
      checkAndLoadCourse(value);
    }
  };

  // Logic to fetch and fill lessons
  const checkAndLoadCourse = async (code: string) => {
    // Only fetch if the code exists in our list (exact match)
    if (!availableCourses.includes(code)) return;

    setIsLoadingCourse(true);
    try {
      const docRef = doc(db, "courses", code);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const courseData = docSnap.data();
        const rawLessons = courseData.lessons || [];
        const timeSlot = courseData.timeSlot || "";

        // Map the Firebase lesson structure to your UI structure
        const mappedLessons = rawLessons.map((l: any) => ({
          name: l.name,
          dateTime: formatLessonDate(l.dateStr, timeSlot),
        }));

        // Update the lessons array in the form data
        // Note: This relies on the parent's onChange handling array values correctly
        onChange("lessons", mappedLessons);
      }
    } catch (err) {
      console.error("Error loading course details:", err);
    } finally {
      setIsLoadingCourse(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-300 shadow-sm px-6 h-[110px] mt-px flex items-center gap-4 overflow-x-auto whitespace-nowrap z-40 min-h-[100px]">
      {/* Defines the autocomplete options globally for this component */}
      <datalist id="course-options-list">
        {availableCourses.map((code) => (
          <option key={code} value={code} />
        ))}
      </datalist>

      {/* Group: Actions */}
      <div className="flex flex-col gap-2 items-center justify-center h-full pt-4 pb-1.5 px-2">
        <button
          onClick={onSave}
          className="flex flex-col items-center justify-center gap-1 h-12 w-14 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer active:scale-95 group"
          title="Save (Ctrl+S)"
        >
          <Save className="w-6 h-6 mb-0.5" />
          <span className="text-[10px] font-medium group-hover:text-blue-600">
            Save
          </span>
        </button>
        <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase mt-auto">
          Actions
        </span>
      </div>

      <Separator />

      {/* Group: Document Details */}
      <RibbonGroup label={isCoursePlan ? "Plan Details" : "Receipt Details"}>
        {!isCoursePlan && (
          <RibbonInput
            label="Receipt No."
            name="receiptNo"
            value={data.receiptNo || ""}
            onChange={handleChange}
            width="w-28"
            placeholder="2025-001"
          />
        )}
        <RibbonInput
          label="Issue Date"
          name="issueDate"
          type="date"
          value={data.issueDate}
          onChange={handleChange}
          width="w-32"
        />
      </RibbonGroup>

      <Separator />

      {/* Group: Student */}
      <RibbonGroup label="Student Information">
        {!isCoursePlan && (
          <RibbonInput
            label="Student Code"
            name="studentCode"
            value={data.studentCode || ""}
            onChange={handleChange}
            width="w-24"
          />
        )}
        <RibbonInput
          label="Student Name"
          name="studentName"
          value={data.studentName}
          onChange={handleChange}
          width="w-40"
        />
        <RibbonSelect
          label="Gender"
          name="gender"
          value={data.gender}
          onChange={handleChange}
          width="w-16"
          options={[
            { value: "", label: "-" },
            { value: "M", label: "M" },
            { value: "F", label: "F" },
          ]}
        />
      </RibbonGroup>

      <Separator />

      {/* Group: Course (Updated with Datalist and Loading State) */}
      <RibbonGroup label="Course Data">
        <div className="relative">
          <RibbonInput
            label="Course Code"
            name="courseCode"
            value={data.courseCode}
            onChange={handleChange}
            width="w-full"
            list="course-options-list" // Connects to the datalist
            placeholder="Type code..."
          />
          {isLoadingCourse && (
            <div className="absolute right-1 top-6">
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
            </div>
          )}
        </div>
      </RibbonGroup>

      <Separator />

      {/* Group: Payment */}
      <RibbonGroup label="Payment">
        <RibbonInput
          label="Method"
          name="paymentMethod"
          value={data.paymentMethod}
          onChange={handleChange}
          width="w-32"
          placeholder="FPS/Cash"
        />
        <RibbonInput
          label="Date"
          name="paymentDate"
          type="date"
          value={data.paymentDate}
          onChange={handleChange}
          width="w-32"
        />
      </RibbonGroup>
    </div>
  );
}

// --- Helper Components (Slight modifications for types) ---

function RibbonGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-between h-full pt-4 pb-1.5">
      <div className="flex gap-3 items-end">{children}</div>
      <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase mt-auto">
        {label}
      </span>
    </div>
  );
}

function RibbonInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  width = "w-24",
  placeholder,
  list, // Added list prop for datalist support
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  width?: string;
  placeholder?: string;
  list?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-gray-500 font-medium px-0.5 truncate max-w-full block">
        {label}
      </span>
      <Input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        list={list} // Applied here
        className={`h-7 text-xs border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-blue-500 px-2 ${width}`}
      />
    </div>
  );
}

function RibbonSelect({
  label,
  name,
  value,
  onChange,
  width = "w-24",
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  width?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-gray-500 font-medium px-0.5 truncate max-w-full block">
        {label}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`h-7 text-xs border border-gray-300 bg-transparent rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 px-1 cursor-pointer ${width}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Separator() {
  return <div className="w-px h-14 bg-gray-200 mx-2" />;
}
