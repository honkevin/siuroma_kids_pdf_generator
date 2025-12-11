import React from "react";
import Image, { StaticImageData } from "next/image";
import logo from "@/assets/logo.png";

interface DocumentPageProps {
  children: React.ReactNode;
  isExport?: boolean;
  headerTitle?: string;
  showCompanyHeader?: boolean;
  className?: string;
}

// -------------------
// Shared Styles
// -------------------
const colors = {
  text: "#111111",
  background: "#FFFFFF",
  heading: "#111111",
  border: "#D1D5DB",
};

const companyTextStyle = {
  color: colors.text,
  fontSize: "0.75rem",
  lineHeight: "1.2",
};

export const DocumentPage = ({
  children,
  isExport = false,
  headerTitle,
  showCompanyHeader = true,
  className = "",
}: DocumentPageProps) => {
  return (
    <div
      className={`w-[794px] h-[1123px] relative bg-white flex flex-col p-8 ${className}`}
      style={{
        color: colors.text,
        backgroundColor: colors.background,
        boxSizing: "border-box", // Critical for keeping padding inside the dimensions
      }}
    >
      {/* ---------------- Header Section ---------------- */}
      {showCompanyHeader && (
        <div className="flex w-full justify-between items-start mb-6 shrink-0">
          <div className="shrink-0">
            {isExport ? (
              <img
                src={logo.src}
                alt="Company Logo"
                style={{ width: "120px", height: "auto" }}
              />
            ) : (
              <Image
                src={logo}
                alt="Company Logo"
                width={120}
                height={60}
                className="h-auto"
                priority={false}
              />
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <p style={{ ...companyTextStyle, fontWeight: 600 }}>
              Unicorn Vision Design Limited
            </p>
            <p style={companyTextStyle}>No.903, 1202, Vogue Centre,</p>
            <p style={companyTextStyle}>696 Castle Peak Road,</p>
            <p style={companyTextStyle}>KL, HK</p>
            <div className="flex gap-2 mt-1">
              <span style={companyTextStyle}>Tel: 3168 6878</span>
              <span style={companyTextStyle}>Fax: 3168 6879</span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Optional Page Title ---------------- */}
      {headerTitle && (
        <h1
          className="text-4xl font-semibold text-center mb-6 -mt-3 shrink-0"
          style={{ color: colors.heading }}
        >
          {headerTitle}
        </h1>
      )}

      {/* ---------------- Content Area ---------------- */}
      {/* flex-1 allows content to fill space; overflow-hidden prevents page break issues visually */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
};
