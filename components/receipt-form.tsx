"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface FormDataType {
  receiptNo: string
  studentName: string
  studentCode: string
  gender: string
  issueDate: string
  classCode: string
  courseCode: string
  courseName: string
  lessons: Array<{ name: string; dateTime: string }>
  paymentMethod: string
  paymentDate: string
}

interface ReceiptFormProps {
  formData: FormDataType
  setFormData: (data: FormDataType) => void
}

export function ReceiptForm({ formData, setFormData }: ReceiptFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleLessonChange = (index: number, field: string, value: string) => {
    const updatedLessons = [...formData.lessons]
    updatedLessons[index] = {
      ...updatedLessons[index],
      [field]: value,
    }
    setFormData({ ...formData, lessons: updatedLessons })
  }

  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <Card className="p-6 border-gray-200">
        <h2 className="w-full text-xl font-bold text-center">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Receipt No."
            name="receiptNo"
            value={formData.receiptNo}
            onChange={handleChange}
            placeholder="Enter receipt number"
          />
          <FormField
            label="Student Name"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            placeholder="Enter student name"
          />
          <FormField
            label="Student Code"
            name="studentCode"
            value={formData.studentCode}
            onChange={handleChange}
            placeholder="Enter student code"
          />
          <FormField label="Gender" name="gender" value={formData.gender} onChange={handleChange} placeholder="M/F" />
          <FormField
            label="Issue Date"
            name="issueDate"
            type="date"
            value={formData.issueDate}
            onChange={handleChange}
          />
          <FormField
            label="Class Code"
            name="classCode"
            value={formData.classCode}
            onChange={handleChange}
            placeholder="Enter class code"
          />
          <FormField
            label="Course Code"
            name="courseCode"
            value={formData.courseCode}
            onChange={handleChange}
            placeholder="Enter course code"
          />
          <FormField
            label="Course Name"
            name="courseName"
            value={formData.courseName}
            onChange={handleChange}
            placeholder="Enter course name"
          />
        </div>
      </Card>

      {/* Lessons Section */}
      <Card className="p-6 border-gray-200">
        <h2 className="w-full text-xl font-bold text-center">Lessons</h2>
        <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {formData.lessons.map((lesson, index) => (
            <div key={index} className="space-y-2">
              <p className="text-xs font-semibold">Lesson {index + 1}</p>
              <Input
                placeholder="Lesson Name"
                value={lesson.name}
                onChange={(e) => handleLessonChange(index, "name", e.target.value)}
                className="text-xs"
              />
              <Input
                type="datetime-local"
                placeholder="Date & Time"
                value={lesson.dateTime}
                onChange={(e) => handleLessonChange(index, "dateTime", e.target.value)}
                className="text-xs"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Payment Details Section */}
      <Card className="p-6 border-gray-200">
        <h2 className="w-full text-xl font-bold text-center">Payment Details</h2>
        <FormField
          label="Payment Method"
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          placeholder="Enter the payment method"
        />
        <FormField
          label="Payment Date"
          name="paymentDate"
          type="date"
          value={formData.paymentDate}
          onChange={handleChange}
        />
      </Card>
    </div>
  )
}

interface FormFieldProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
}

function FormField({ label, name, value, onChange, placeholder, type = "text" }: FormFieldProps) {
  return (
    <div>
      <label className="text-sm block mb-1">{label}</label>
      <Input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  )
}
