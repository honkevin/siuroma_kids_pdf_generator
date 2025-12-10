// components/receipt/receipt-form.tsx

"use client";

import type React from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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

export function ReceiptForm({ formData, setFormData }: ReceiptFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
      <Card className="border-gray-200 px-4 py-4">
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
          <FormField
            label="Course Code"
            name="courseCode"
            value={formData.courseCode}
            onChange={handleChange}
            placeholder="e.g. EN-101"
          />
        </div>
      </Card>

      {/* Lessons grid */}
      <Card className="border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Lessons Schedule
          </h2>
          <p className="text-[11px] text-gray-400">
            Up to {formData.lessons.length} lessons
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
        </div>
      </Card>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
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
