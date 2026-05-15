import React, { useState, useEffect } from "react";
import { Modal, Button, Text, Group, Breadcrumbs, Anchor } from '@mantine/core';
import { Plus, FileUp, FileText, Trash2, Clock, Folder, ChevronRight, ArrowLeft } from "lucide-react";
import type { Guide, Folder as FolderType } from "../types";
import { storage } from "../services/storage";

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

  const refreshData = () => {
    setGuides(storage.getGuides());
    setFolders(storage.getFolders());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openDeleteModal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
    setModalOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      storage.deleteGuide(deleteId);
      refreshData();
    }
    setModalOpen(false);
    setDeleteId(null);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportMd(file);
    }
  };

  const currentFolder = folders.find(f => f.id === currentFolderId);
  const displayedFolders = folders.filter(f => f.parentId === currentFolderId);
  const displayedGuides = guides.filter(g => g.folderId === currentFolderId);

  // Breadcrumbs logic
  const getBreadcrumbs = () => {
    const crumbs = [];
    let tempId = currentFolderId;
    while (tempId) {
      const f = folders.find(folder => folder.id === tempId);
      if (f) {
        crumbs.unshift(f);
        tempId = f.parentId;
      } else {
        tempId = null;
      }
    }
    return crumbs;
  };

  const crumbs = getBreadcrumbs();

  return (
    <div className="max-w-6xl mx-auto p-8">
      <header className="mb-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {currentFolder ? currentFolder.name : "Mis Clientes"}
            </h1>
            <p className="text-slate-500 mt-1">
              {currentFolder ? "Gestiona los proyectos y guías de este cliente" : "Explora tus clientes y proyectos de medición"}
            </p>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 cursor-pointer transition-all text-slate-700 font-medium">
              <FileUp size={18} />
              Importar .md
              <input type="file" accept=".md" className="hidden" onChange={handleFileChange} />
            </label>
            <Button 
              leftSection={<Plus size={18} />} 
              onClick={() => onNewGuide(currentFolderId)}
              variant="filled"
              color="blue"
            >
              Nueva guía
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 py-2 px-4 bg-slate-100/50 rounded-lg border border-slate-200/60">
          <button 
            onClick={() => setCurrentFolderId(null)}
            className={`text-sm font-medium ${!currentFolderId ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Inicio
          </button>
          {crumbs.map((crumb) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={14} className="text-slate-300" />
              <button 
                onClick={() => setCurrentFolderId(crumb.id)}
                className={`text-sm font-medium ${crumb.id === currentFolderId ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </header>

      {displayedFolders.length === 0 && displayedGuides.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-20 text-center">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder className="text-slate-400" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Esta sección está vacía</h2>
          <p className="text-slate-500 mb-8 max-w-xs mx-auto">Comienza creando una nueva carpeta o guía aquí mismo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Folders first */}
          {displayedFolders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => setCurrentFolderId(folder.id)}
              className="group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <Folder size={32} className="text-blue-500 fill-blue-50 group-hover:fill-blue-100" />
              </div>
              <h3 className="font-bold text-slate-800 truncate w-full px-2">{folder.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Carpeta</p>
            </div>
          ))}

          {/* Guides second */}
          {displayedGuides.map((guide) => (
            <div
              key={guide.id}
              onClick={() => onSelectGuide(guide.id)}
              className="group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all flex flex-col relative"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
                <FileText size={24} className="text-slate-400 group-hover:text-blue-500" />
              </div>
              <h3 className="font-bold text-slate-800 line-clamp-2 pr-6 mb-2">{guide.title || "Guía sin título"}</h3>
              <div className="mt-auto flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                <Clock size={12} />
                <span>{formatDate(guide.updatedAt)}</span>
              </div>
              <button
                onClick={(e) => openDeleteModal(e, guide.id)}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación de borrado */}
      <Modal
        opened={modalOpen}
        onClose={() => setDeleteId(null)}
        title="Confirmar eliminación"
        centered
      >
        <Text size="sm">¿Estás seguro de que quieres eliminar esta guía? Esta acción no se puede deshacer.</Text>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Eliminar guía
          </Button>
        </Group>
      </Modal>
    </div>
  );
};
