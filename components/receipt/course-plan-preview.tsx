// components/receipt/course-plan-preview.tsx

"use client";

import Image from "next/image";
import logo from "@/assets/logo.png";

export interface Lesson {
  name: string;
  dateTime: string;
}

// Reuse the type, but we know some fields are optional here
export interface FormDataType {
  type?: "receipt" | "course_plan";
  receiptNo?: string;
  studentName: string;
  studentCode?: string;
  gender: string;
  issueDate: string;
  courseCode: string;
  lessons: Lesson[];
  paymentMethod: string;
  paymentDate: string;
}

interface CoursePlanPreviewProps {
  formData: FormDataType;
  isExport?: boolean;
}

const formatDisplayDate = (val: string) => {
  if (!val) return "";
  if (val.includes("T")) {
    const [datePart, timePart] = val.split("T");
    const [year, month, day] = datePart.split("-");
    const [hourStr, minute] = timePart.split(":");
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${day}/${month}/${year}, ${hour12}:${minute} ${ampm}`;
  }
  if (val.includes("-")) {
    const [year, month, day] = val.split("-");
    return `${day}/${month}/${year}`;
  }
  return val;
};

export function CoursePlanPreview({
  formData,
  isExport = false,
}: CoursePlanPreviewProps) {
  const containsChinese = (text = "") => /[\u4e00-\u9fff]/.test(text);

  const spacing = {
    containerPadding: "p-8",
    headerStackGap: "gap-1",
    contactRowGap: "gap-2",
    contactRowMarginTop: "mt-1",
    titleMarginBottom: "mb-6",
    sectionTitleMarginBottom: "mb-2",
    sectionVerticalMargin: "my-2",
    standardGridGap: "gap-4",
    tightListSpacing: "space-y-[4px]",
    bulletListIndent: "ml-4",
    lessonGridGap: "gap-3",
    lessonColumnSpacing: "space-y-3",
    lessonRowGap: "gap-2",
  };

  const textSizes = {
    headerLarge: "text-4xl",
    sectionTitle: "text-base",
    bodyText: "text-sm",
    bodyBold: "font-semibold text-sm",
    indexNumber: "text-3xl font-medium min-w-[35px]",
    paidAmount: "text-sm font-semibold",
    companyInfo: "text-xs",
  };

  const colors = {
    text: "#111111",
    border: "#D1D5DB",
    background: "#FFFFFF",
    heading: "#111111",
    indexNumber: "#9CA3AF",
    lineThrough: "#6B7280",
  };

  const companyTextStyle = { color: colors.text, fontSize: "0.75rem" };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className={spacing.sectionTitleMarginBottom}>
      <h2 className={`font-bold ${textSizes.sectionTitle}`}>{title}</h2>
      <div
        className="w-full border-b mt-1"
        style={{
          borderColor: colors.border,
          position: "relative",
          top: isExport ? "8px" : "0px",
        }}
      />
    </div>
  );

  return (
    <div
      className={`w-full h-full leading-snug ${spacing.containerPadding}`}
      style={{ color: colors.text, backgroundColor: colors.background }}
    >
      {/* ---------------- Header ---------------- */}
      <div className="flex w-full justify-between items-start">
        <div className="shrink-0">
          <Image
            src={logo}
            alt="Company Logo"
            width={120}
            height={60}
            className="h-auto"
            priority={false}
          />
        </div>

        <div className="flex w-full justify-end">
          <div
            className={`flex flex-col justify-end ${spacing.headerStackGap}`}
          >
            <p style={{ ...companyTextStyle, fontWeight: 600 }}>
              Unicorn Vision Design Limited
            </p>
            <p style={companyTextStyle}>No.903, 1202, Vogue Centre,</p>
            <p style={companyTextStyle}>696 Castle Peak Road,</p>
            <p style={companyTextStyle}>KL, HK</p>
            <div
              className={`flex justify-end ${spacing.contactRowGap} ${spacing.contactRowMarginTop}`}
            >
              <span style={companyTextStyle}>Tel: 3168 6878</span>
              <span style={companyTextStyle}>Fax: 3168 6879</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Title (Changed to Course Plan) ---------------- */}
      <h1
        className={`-mt-3 text-center font-semibold ${spacing.titleMarginBottom} ${textSizes.headerLarge}`}
        style={{ color: colors.heading }}
      >
        Course Plan
      </h1>

      {/* ---------------- Basic Info (Removed ReceiptNo & StudentCode) ---------------- */}
      <section>
        <SectionHeader title="Basic Info" />
        <div className={`grid grid-cols-2 ${spacing.standardGridGap}`}>
          {/* Left Column */}
          <div className={`${textSizes.bodyText} ${spacing.tightListSpacing}`}>
            {/* REMOVED RECEIPT NO */}
            <div>Issue Date: {formatDisplayDate(formData.issueDate)}</div>
            <div>
              Student Name:{" "}
              <span
                className={
                  containsChinese(formData.studentName) ? "chinese" : ""
                }
              >
                {formData.studentName}
              </span>
            </div>
          </div>
          {/* Right Column */}
          <div className={`${textSizes.bodyText} ${spacing.tightListSpacing}`}>
            {/* REMOVED STUDENT CODE */}
            <div>Course Code: {formData.courseCode}</div>
            <div>Gender: {formData.gender}</div>
          </div>
        </div>
      </section>

      {/* ---------------- Lesson Info ---------------- */}
      <section className={spacing.sectionVerticalMargin}>
        <SectionHeader title="Lesson Info" />
        <div
          className={`${spacing.sectionVerticalMargin} ${spacing.tightListSpacing}`}
        >
          <p className={textSizes.bodyText}>Total Lessons: 12 Lessons</p>
          <p className={textSizes.bodyText}>
            Duration: 1 Hour 25 Minutes / Lesson
          </p>
          <p className={textSizes.bodyText}>Lessons Enrolled:</p>

          <div className={`grid grid-cols-2 ${spacing.lessonGridGap}`}>
            {/* Left column */}
            <div className={spacing.lessonColumnSpacing}>
              {formData.lessons
                .slice(0, Math.ceil(formData.lessons.length / 2))
                .map((lesson, index) => (
                  <div key={index} className={`flex ${spacing.lessonRowGap}`}>
                    <div className="flex justify-center items-center">
                      <div
                        className={textSizes.indexNumber}
                        style={{ color: colors.indexNumber }}
                      >
                        {(index + 1).toString().padStart(2, "0")}
                      </div>
                    </div>
                    <div className="flex-1">
                      {lesson.name && (
                        <p
                          className={`${textSizes.bodyBold} ${
                            containsChinese(lesson.name) ? "chinese" : ""
                          }`}
                          style={{ color: colors.text }}
                        >
                          {lesson.name}
                        </p>
                      )}
                      {lesson.dateTime && (
                        <p
                          className={textSizes.bodyText}
                          style={{ color: colors.text }}
                        >
                          {formatDisplayDate(lesson.dateTime)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Right column */}
            <div className={spacing.lessonColumnSpacing}>
              {formData.lessons
                .slice(Math.ceil(formData.lessons.length / 2))
                .map((lesson, index) => {
                  const originalIndex =
                    index + Math.ceil(formData.lessons.length / 2);
                  return (
                    <div
                      key={originalIndex}
                      className={`flex ${spacing.lessonRowGap}`}
                    >
                      <div
                        className={textSizes.indexNumber}
                        style={{ color: colors.indexNumber }}
                      >
                        {(originalIndex + 1).toString().padStart(2, "0")}
                      </div>
                      <div className="flex-1">
                        {lesson.name && (
                          <p
                            className={`${textSizes.bodyBold} ${
                              containsChinese(lesson.name) ? "chinese" : ""
                            }`}
                            style={{ color: colors.text }}
                          >
                            {lesson.name}
                          </p>
                        )}
                        {lesson.dateTime && (
                          <p
                            className={textSizes.bodyText}
                            style={{ color: colors.text }}
                          >
                            {formatDisplayDate(lesson.dateTime)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Add-ons ---------------- */}
      <section>
        <SectionHeader title="Add-ons" />
        <div className={spacing.tightListSpacing}>
          <p className={textSizes.bodyText} style={{ color: colors.text }}>
            Item Name: 15-minute studio headshot session for kids
          </p>
          <p className={textSizes.bodyText} style={{ color: colors.text }}>
            Description: At least 5 photos in jpg format (with basic retouch)
          </p>
          <p className={textSizes.bodyText} style={{ color: colors.text }}>
            Price:{" "}
            <span className="relative inline-block mr-1">
              <span style={{ color: colors.lineThrough }}>HKD 500.00</span>
              <span
                className="absolute left-0 right-0 border-t"
                style={{
                  top: isExport ? "85%" : "55%",
                  borderColor: colors.lineThrough,
                }}
              />
            </span>
            (Waived)
          </p>
        </div>
      </section>

      {/* ---------------- Pricing ---------------- */}
      <section className={spacing.sectionVerticalMargin}>
        <SectionHeader title="Price" />
        <div className={`grid grid-cols-2 ${spacing.standardGridGap}`}>
          <div className={spacing.tightListSpacing}>
            <p className={textSizes.bodyText} style={{ color: colors.text }}>
              Section Price: HKD 3,840.00
            </p>
            <p className={textSizes.bodyText} style={{ color: colors.text }}>
              Discount: HKD 960.00
            </p>
            <p className={textSizes.bodyText} style={{ color: colors.text }}>
              Coupon: HKD 0.00
            </p>
          </div>
          <div className={spacing.tightListSpacing}>
            <p className={textSizes.paidAmount} style={{ color: colors.text }}>
              Paid Amount: HKD 2,880.00
            </p>
            <p className={textSizes.bodyText} style={{ color: colors.text }}>
              Payment Method: {formData.paymentMethod}
            </p>
            {formData.paymentDate && (
              <p className={textSizes.bodyText} style={{ color: colors.text }}>
                Payment Date: {formatDisplayDate(formData.paymentDate)}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- Payment & Refunds ---------------- */}
      <section>
        <SectionHeader title="Payment and Refunds" />
        <div className={`grid grid-cols-2 ${spacing.standardGridGap}`}>
          <div>
            <p className={textSizes.bodyBold} style={{ color: colors.text }}>
              Payment of Fees
            </p>
            <ul
              className={`${spacing.bulletListIndent} list-disc ${spacing.tightListSpacing}`}
            >
              <li className={textSizes.bodyText} style={{ color: colors.text }}>
                Fees must be paid in full before students attend classes.
              </li>
              <li className={textSizes.bodyText} style={{ color: colors.text }}>
                Promotion/discount bookings are non-refundable and
                non-transferable.
              </li>
            </ul>
          </div>
          <div>
            <p className={textSizes.bodyBold} style={{ color: colors.text }}>
              Refund Policy
            </p>
            <ul
              className={`${spacing.bulletListIndent} list-disc ${spacing.tightListSpacing}`}
            >
              <li className={textSizes.bodyText} style={{ color: colors.text }}>
                We regret we cannot issue refunds once payment is made.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
