import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Assumes @ maps to root
import { SavedFile } from "@/types";

export function useFileSystem() {
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);

  // Helper to sync state + localStorage
  const persistFiles = (files: SavedFile[]) => {
    setSavedFiles(files);
    localStorage.setItem("rc_saved_files", JSON.stringify(files));
  };

  // Load from Storage on mount
  useEffect(() => {
    // 1. Local Cache
    const stored = localStorage.getItem("rc_saved_files");
    if (stored) {
      try {
        setSavedFiles(JSON.parse(stored));
      } catch (e) {
        console.error("Local load failed", e);
      }
    }

    // 2. Firestore Sync
    const fetchFromFirestore = async () => {
      try {
        const q = query(
          collection(db, "entries"),
          orderBy("lastModified", "desc")
        );
        const snap = await getDocs(q);
        const files: SavedFile[] = snap.docs.map((d) => {
          const data = d.data() as Omit<SavedFile, "id">;
          return { id: d.id, ...data };
        });
        persistFiles(files);
      } catch (e) {
        console.error("Firestore load failed", e);
      }
    };

    fetchFromFirestore();
  }, []);

  const saveFile = async (file: SavedFile) => {
    // Optimistic update
    const existingIdx = savedFiles.findIndex((f) => f.id === file.id);
    const newFileList = [...savedFiles];

    if (existingIdx >= 0) {
      newFileList[existingIdx] = file;
    } else {
      newFileList.unshift(file);
    }
    persistFiles(newFileList);

    // Firestore
    try {
      await setDoc(doc(collection(db, "entries"), file.id), {
        title: file.title,
        lastModified: file.lastModified,
        data: file.data,
      });
    } catch (e) {
      console.error("Firestore save failed", e);
    }
  };

  const deleteFile = async (id: string) => {
    const newFiles = savedFiles.filter((f) => f.id !== id);
    persistFiles(newFiles);

    try {
      await deleteDoc(doc(db, "entries", id));
    } catch (e) {
      console.error("Failed to delete from Firestore", e);
    }
  };

  const duplicateFile = async (file: SavedFile) => {
    const newId = crypto.randomUUID();
    const newFile: SavedFile = {
      ...file,
      id: newId,
      title: `${file.title} (Copy)`,
      lastModified: Date.now(),
      data: { ...file.data },
    };

    await saveFile(newFile);
  };

  return {
    savedFiles,
    saveFile,
    deleteFile,
    duplicateFile,
  };
}
