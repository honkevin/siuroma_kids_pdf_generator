export interface Lesson {
  name: string;
  dateTime: string;
}

export interface FormDataType {
  type?: "receipt" | "course_plan";
  receiptNo?: string;
  studentName: string;
  studentCode: string;
  gender: string;
  parentContact: string;
  issueDate: string;
  courseCode: string;
  lessons: Lesson[];
  paymentMethod: string;
  paymentDate: string;
}

export interface Tab {
  id: string;
  title: string;
}

export interface ReceiptTab extends Tab {
  data: FormDataType;
  savedFileId?: string;
  zoom: number;
  scrollTop: number;
}

export interface SavedFile {
  id: string;
  title: string;
  lastModified: number;
  data: FormDataType;
}

export const DEFAULT_LESSONS = Array(12).fill({ name: "", dateTime: "" });

export const NEW_RECEIPT_TEMPLATE: FormDataType = {
  type: "receipt",
  receiptNo: "",
  studentName: "",
  studentCode: "",
  gender: "",
  parentContact: "",
  issueDate: new Date().toISOString().split("T")[0],
  courseCode: "",
  lessons: DEFAULT_LESSONS,
  paymentMethod: "",
  paymentDate: "",
};

export const NEW_COURSE_PLAN_TEMPLATE: FormDataType = {
  type: "course_plan",
  studentName: "",
  studentCode: "",
  gender: "",
  parentContact: "",
  issueDate: new Date().toISOString().split("T")[0],
  courseCode: "",
  lessons: DEFAULT_LESSONS,
  paymentMethod: "",
  paymentDate: "",
};
