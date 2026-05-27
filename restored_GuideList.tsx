Created At: 2026-05-27T01:48:09Z
Completed At: 2026-05-27T01:48:09Z
File Path: `file:///Users/apereyra/Documents/editor%20guias/src/pages/GuideList.tsx`
Total Lines: 498
Total Bytes: 20453
Showing lines 1 to 498
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Text, Group, Progress } from '@mantine/core';
import { Plus, FileUp, FileText, Trash2, Clock, Folder, ChevronRight, BookOpen, Upload, FolderOpen, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { Guide, Folder as FolderType } from "../types";
import { exportGuideAsMarkdown } from "../services/markdownExporter";
import { Download } from "lucide-react";
import { storage } from "../services/storage";
import { importGitBook } from "../services/gitbookImporter";

interface GuideListProps {
  onSelectGuide: (id: string) => void;
  onNewGuide: (folderId: string | null) => void;
  onImportMd: (file: File) => void;
}

export const GuideList: React.FC<GuideListProps> = ({
  onSelectGuide,
  onNewGuide,
  onImportMd,
}) => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // States for GitBook Import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<"zip" | "folder">("zip");
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [importError, setImportError] = useState("");
  const [importStats, setImportStats] = useState<{ folderCount: num
<truncated 19276 bytes>
                 onClick={() => {
                  setIsImportModalOpen(false);
                }}
              >
                Volver a la lista
              </Button>
              {importStats?.firstGuideId && (
                <Button
                  color="blue"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    if (importStats.firstGuideId) {
                      onSelectGuide(importStats.firstGuideId);
                    }
                  }}
                >
                  Ver guías importadas
                </Button>
              )}
            </div>
          </div>
        )}

        {importStatus === "error" && (
          <div className="space-y-6 pt-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-800">
              <AlertCircle size={24} className="shrink-0" />
              <div>
                <span className="font-bold block mb-1">Error en la importación</span>
                <span className="text-sm">{importError}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="default"
                onClick={() => {
                  setImportStatus("idle");
                }}
              >
                Reintentar
              </Button>
              <Button
                color="blue"
                onClick={() => {
                  setIsImportModalOpen(false);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

The above content shows the entire, complete file contents of the requested file.
