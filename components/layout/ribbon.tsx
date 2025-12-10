// components/layout/ribbon.tsx

"use client";

import type React from "react";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { FormDataType } from "@/app/page";

interface RibbonProps {
  data: FormDataType;
  onChange: (field: keyof FormDataType, value: any) => void;
  onSave: () => void;
}

export function Ribbon({ data, onChange, onSave }: RibbonProps) {
  // Determine mode
  const isCoursePlan = data.type === "course_plan";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    onChange(e.target.name as keyof FormDataType, e.target.value);
  };

  return (
    <div className="bg-white border-b border-gray-300 shadow-sm px-6 h-[110px] mt-px flex items-center gap-4 overflow-x-auto whitespace-nowrap z-40 min-h-[100px]">
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

      {/* Group: Document Details (Dynamic Label) */}
      <RibbonGroup label={isCoursePlan ? "Plan Details" : "Receipt Details"}>
        {/* Only show Receipt No for Receipts */}
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
        {/* Only show Student Code for Receipts */}
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

      {/* Group: Course */}
      <RibbonGroup label="Course Data">
        <RibbonInput
          label="Course Code"
          name="courseCode"
          value={data.courseCode}
          onChange={handleChange}
          width="w-24"
        />
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

// --- Helper Components (Unchanged) ---

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
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  width?: string;
  placeholder?: string;
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
