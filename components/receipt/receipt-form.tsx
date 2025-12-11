// components/receipt/receipt-form.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/firebase"; // Adjust this import to your actual firebase config path
import { collection, getDocs, doc, getDoc, query } from "firebase/firestore";

export interface FormDataType {
  type?: "receipt" | "course_plan";
  receiptNo?: string;
  studentName: string;
  studentCode?: string;
  gender: string;
  issueDate: string;
  courseCode: string;
  lessons: Array<{ name: string; dateTime: string }>;
  paymentMethod: string;
  paymentDate: string;
}

interface ReceiptFormProps {
  formData: FormDataType;
  setFormData: (data: FormDataType) => void;
}

// Helper to format date string from "YYYY-MM-DD" + TimeSlot to datetime-local format if needed
// Or simply map the incoming dateStr to the field.
const formatLessonDate = (dateStr: string, timeSlot?: string) => {
  // Simple mapping: 2025-12-06 -> 2025-12-06T00:00 (or parse timeSlot if you want precision)
  // If timeSlot is "SAT 14:00 - 16:00", we can try to extract 14:00
  let timePart = "00:00";
  if (timeSlot) {
    const match = timeSlot.match(/(\d{2}:\d{2})/);
    if (match) timePart = match[1];
  }
  return `${dateStr}T${timePart}`;
};

export function ReceiptForm({ formData, setFormData }: ReceiptFormProps) {
  // State for autocomplete
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);

  // 1. Fetch available course codes on mount
  useEffect(() => {
    const fetchCourseCodes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        const codes = querySnapshot.docs.map((doc) => doc.id); // e.g., ["SPEC_C001", "SPEC_C002"]
        setCourseOptions(codes);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourseCodes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Show suggestions if typing in courseCode
    if (name === "courseCode") {
      setShowSuggestions(true);
    }
  };

  // 2. Handle Course Selection
  const handleSelectCourse = async (code: string) => {
    setShowSuggestions(false);
    setIsLoadingCourse(true);

    // Update the course code field immediately
    setFormData({ ...formData, courseCode: code });

    try {
      const docRef = doc(db, "courses", code);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const firebaseLessons = data.lessons || [];
        const timeSlot = data.timeSlot || ""; // e.g. "SAT 14:00 - 16:00"

        // Map Firebase lesson structure to your FormDataType lesson structure
        const mappedLessons = firebaseLessons.map((l: any) => ({
          name: l.name,
          // Combine dateStr with the start time from timeSlot if available
          dateTime: formatLessonDate(l.dateStr, timeSlot),
        }));

        // Fill empty slots if less than 12, or just take the mapped ones
        // Your original form seems to handle variable lengths, but the requirement said "fill ... array in its entirety of the 12 lessons"
        setFormData({
          ...formData,
          courseCode: code,
          lessons: mappedLessons,
        });
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
    } finally {
      setIsLoadingCourse(false);
    }
  };

  const handleLessonChange = (index: number, field: string, value: string) => {
    const updatedLessons = [...formData.lessons];
    updatedLessons[index] = {
      ...updatedLessons[index],
      [field]: value,
    };
    setFormData({ ...formData, lessons: updatedLessons });
  };

  return (
    <div className="space-y-4">
      {/* Top strip: key identifiers */}
      <Card className="border-gray-200 px-4 py-3">
        <div className="flex flex-wrap gap-3 items-end">
          <InlineField
            label="Receipt No."
            name="receiptNo"
            value={formData.receiptNo || ""}
            onChange={handleChange}
            placeholder="e.g. 2025-0012"
            className="w-36"
          />
          <InlineField
            label="Student Code"
            name="studentCode"
            value={formData.studentCode || ""}
            onChange={handleChange}
            placeholder="Student ID"
            className="w-40"
          />
          <InlineField
            label="Issue Date"
            name="issueDate"
            type="date"
            value={formData.issueDate}
            onChange={handleChange}
            className="w-44"
          />
          <InlineField
            label="Payment Date"
            name="paymentDate"
            type="date"
            value={formData.paymentDate}
            onChange={handleChange}
            className="w-44"
          />
          <InlineField
            label="Payment Method"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            placeholder="Cash / FPS / Card"
            className="flex-1 min-w-[180px]"
          />
        </div>
      </Card>

      {/* Student & course block */}
      <Card className="border-gray-200 px-4 py-4 overflow-visible relative">
        {/* Note: overflow-visible needed for dropdown to show if it extends outside */}

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Student & Course
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Student Name"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            placeholder="Full name"
          />
          <FormField
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            placeholder="M / F / Other"
          />

          {/* Modified Course Code Field with Autocomplete */}
          <div className="relative">
            <FormField
              label="Course Code"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleChange}
              placeholder="e.g. SPEC_C001"
              // Disable browser autocomplete to avoid clash
              autoComplete="off"
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                {courseOptions
                  .filter((code) =>
                    code
                      .toLowerCase()
                      .includes(formData.courseCode.toLowerCase())
                  )
                  .map((code) => (
                    <div
                      key={code}
                      className="px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer text-gray-700"
                      onClick={() => handleSelectCourse(code)}
                    >
                      {code}
                    </div>
                  ))}
                {courseOptions.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-400">
                    No courses found
                  </div>
                )}
              </div>
            )}

            {/* Loading Indicator */}
            {isLoadingCourse && (
              <div className="absolute right-2 top-8 text-[10px] text-gray-400">
                Loading...
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Lessons grid */}
      <Card className="border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Lessons Schedule
          </h2>
          <p className="text-[11px] text-gray-400">
            {formData.lessons.length > 0 ? formData.lessons.length : 0} lessons
            loaded
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
          {formData.lessons.map((lesson, index) => (
            <div
              key={index}
              className="border border-dashed border-gray-200 rounded-md px-3 py-2 space-y-1 bg-white"
            >
              <p className="text-[11px] font-semibold text-gray-500">
                Lesson {index + 1}
              </p>
              <Input
                placeholder="Lesson name or topic"
                value={lesson.name}
                onChange={(e) =>
                  handleLessonChange(index, "name", e.target.value)
                }
                className="h-8 text-xs"
              />
              <Input
                type="datetime-local"
                placeholder="Date & time"
                value={lesson.dateTime}
                onChange={(e) =>
                  handleLessonChange(index, "dateTime", e.target.value)
                }
                className="h-8 text-xs"
              />
            </div>
          ))}
          {formData.lessons.length === 0 && (
            <div className="text-xs text-gray-400 col-span-2 text-center py-4">
              No lessons added yet. Select a course code to auto-fill.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ... FormField and InlineField components remain unchanged ...
// But I'll include FormField here just in case you need to see where props go
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  ...props
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="text-xs font-medium block mb-1 text-gray-700">
        {label}
      </label>
      <Input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-8 text-xs"
        {...props}
      />
    </div>
  );
}

interface InlineFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}

function InlineField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: InlineFieldProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-[11px] text-gray-300 uppercase tracking-wide">
        {label}
      </span>
      <Input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-7 text-xs bg-white/95"
      />
    </div>
  );
}
