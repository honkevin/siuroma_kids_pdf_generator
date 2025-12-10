"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { ReceiptPreview, FormDataType } from "@/components/receipt-preview"
import { ReceiptForm } from "@/components/receipt-form"

type Lesson = { name: string; dateTime: string }

export default function Home() {
  // ---------- Form Data State ----------
  const [formData, setFormData] = useState<FormDataType>({
    receiptNo: "",
    studentName: "",
    studentCode: "",
    gender: "",
    issueDate: "",
    classCode: "",
    courseCode: "",
    courseName: "",
    lessons: Array<Lesson>(12).fill({ name: "", dateTime: "" }),
    paymentMethod: "",
    paymentDate: "",
  })

  // Refs
  const exportPageRef = useRef<HTMLDivElement | null>(null) // Actual A4 for export (off-screen)
  const previewContainerRef = useRef<HTMLDivElement | null>(null) // Container for scaling preview
  const previewPageRef = useRef<HTMLDivElement | null>(null) // Visible preview page

  // Scaling & Export State
  const [scale, setScale] = useState(1)
  const [isExporting, setIsExporting] = useState(false)

  const A4_PX = { width: 794, height: 1123 } // A4 at 96dpi

  // ---------- Calculate Scale for Visible Preview ----------
  const updateScale = useCallback(() => {
    const container = previewContainerRef.current
    const page = previewPageRef.current
    if (!container || !page) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // Calculate scale to fit width
    const newScale = containerWidth / A4_PX.width
    setScale(newScale)
  }, [])

  useEffect(() => {
    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [updateScale])

  // Ensure scaling works when DOM content loads/changes
  useEffect(() => {
    if (!previewContainerRef.current) return
    const obs = new MutationObserver(() => updateScale())
    obs.observe(previewContainerRef.current, { childList: true, subtree: true, attributes: true })
    return () => obs.disconnect()
  }, [updateScale])

  // ---------- Export Handler ----------
  const handleExportPDF = async () => {
    if (!exportPageRef.current) {
      alert("Export element not found.")
      return
    }
  
    setIsExporting(true)
    try {
      if ("fonts" in document) {
        // @ts-ignore
        await (document as any).fonts.ready
      }
      // Brief wait to ensure styles settle
      await new Promise((r) => setTimeout(r, 80))
    
      const html2canvasModule = await import("html2canvas")
      const html2canvas = html2canvasModule.default ?? html2canvasModule
      const { jsPDF } = await import("jspdf")
    
      const canvas = await html2canvas(exportPageRef.current, {
        scale: 2, // High res for print
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
      })
    
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const imgHeight = (canvas.height * pdfWidth) / canvas.width
    
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight)
    
      // Filename generation
      const filename = formData.receiptNo
        ? `Siuroma Receipt (${formData.receiptNo})`
        : "Siuroma Receipt"
      pdf.save(filename)
    } catch (err) {
      console.error("[PDF Export Error]", err)
      alert("Failed to export PDF. See console for details.")
    } finally {
      setIsExporting(false)
    }
  }
  
  // ---------- Render ----------
  return (
    <main 
      className="p-4 md:p-8 2xl:px-[10%] [@media(min-width:1800px)]:px-[20%] [@media(min-width:2200px)]:px-[25%] [@media (min-width:2600px)]:px-[28%] [@media(min-width:3000px)]:px-[30%] [@media(min-width:3100px)]:px-[37%] flex flex-col gap-7 min-h-screen bg-neutral-100"
    >
      <div className="w-full flex justify-center items-center">
        <Card className="py-2 px-6">
          <h1 className="text-2xl font-semibold text-center">Siuroma Kids Receipt Creator</h1>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Form Area */}
        <div className="space-y-6">
          <ReceiptForm formData={formData} setFormData={setFormData} />
        </div>

        {/* Preview & Download Area */}
        <section className="flex flex-col items-center">
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="w-full h-20 bg-white hover:bg-white/70 flex items-center justify-center gap-3 cursor-pointer shadow-sm border border-gray-200 text-black font-semibold rounded-xl"
          >
            <Download className="w-5 h-5" />
            <span>{isExporting ? "Exporting..." : "Download PDF"}</span>
          </Button>

          {/* Scale Container */}
          <div
            id="preview-container"
            ref={previewContainerRef}
            className="mt-6 w-full h-[700px] md:h-[900px] flex justify-center items-start overflow-hidden bg-transparent"
            style={{ minHeight: A4_PX.height * scale }}
          >
            {/* Transform Wrapper */}
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top center",
                transition: "transform 160ms ease",
              }}
            >
              {/* Visible Page: isExport={false} (default) */}
              <div
                ref={previewPageRef}
                id="preview-page"
                className="w-[794px] h-[1123px] bg-white border border-neutral-600 overflow-hidden"
              >
                <ReceiptPreview formData={formData} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ---------- Hidden Export A4 ---------- */}
      {/* 
          1. Position absolute off-screen so html2canvas can "see" it.
          2. We pass isExport={true} here to trigger the offset fixes.
      */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          width: A4_PX.width,
          height: A4_PX.height,
          overflow: "hidden",
        }}
      >
        <div
          ref={exportPageRef}
          className="bg-white"
          style={{
            width: A4_PX.width,
            height: A4_PX.height,
            boxSizing: "border-box",
            padding: 0,
            margin: 0,
          }}
        >
          {/* VITAL: Pass isExport={true} to fix line positions in PDF */}
          <ReceiptPreview formData={formData} isExport={true} />
        </div>
      </div>
    </main>
  )
}
