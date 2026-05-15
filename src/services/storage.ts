import type { Guide, GuideStore, Folder } from "../types";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "ga4_measurement_guides";

export const storage = {
  getStore(): GuideStore {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { guides: [], folders: [] };
    try {
      const parsed = JSON.parse(data);
      return {
        guides: parsed.guides || [],
        folders: parsed.folders || []
      };
    } catch (e) {
      console.error("Error parsing storage", e);
      return { guides: [], folders: [] };
    }
  },

  saveStore(store: GuideStore) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  },

  getGuides(): Guide[] {
    return this.getStore().guides;
  },

  getGuide(id: string): Guide | undefined {
    return this.getGuides().find((g) => g.id === id);
  },

  saveGuide(guide: Guide) {
    const store = this.getStore();
    const index = store.guides.findIndex((g) => g.id === guide.id);
    if (index >= 0) {
      store.guides[index] = { ...guide, updatedAt: new Date().toISOString() };
    } else {
      store.guides.push({
        ...guide,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.saveStore(store);
  },

  deleteGuide(id: string) {
    const store = this.getStore();
    store.guides = store.guides.filter((g) => g.id !== id);
    this.saveStore(store);
  },

  // Folder management
  getFolders(): Folder[] {
    return this.getStore().folders;
  },

  saveFolder(folder: Folder) {
    const store = this.getStore();
    const index = store.folders.findIndex((f) => f.id === folder.id);
    if (index >= 0) {
      store.folders[index] = folder;
    } else {
      store.folders.push(folder);
    }
    this.saveStore(store);
  },

  deleteFolder(id: string) {
    const store = this.getStore();
    // Delete folder and recursively delete children? 
    // For now: delete folder and move children to parent or root
    const folder = store.folders.find(f => f.id === id);
    const newParentId = folder?.parentId || null;

    store.folders = store.folders.filter((f) => f.id !== id);
    store.folders = store.folders.map(f => f.parentId === id ? { ...f, parentId: newParentId } : f);
    store.guides = store.guides.map(g => g.folderId === id ? { ...g, folderId: newParentId } : g);
    
    this.saveStore(store);
  },

  moveGuide(guideId: string, folderId: string | null) {
    const store = this.getStore();
    const guide = store.guides.find(g => g.id === guideId);
    if (guide) {
      guide.folderId = folderId;
      guide.updatedAt = new Date().toISOString();
      this.saveStore(store);
    }
  },

  moveFolder(folderId: string, parentId: string | null) {
    if (folderId === parentId) return; // Prevent self-nesting
    const store = this.getStore();
    const folder = store.folders.find(f => f.id === folderId);
    if (folder) {
      folder.parentId = parentId;
      this.saveStore(store);
    }
  },

  copyGuide(guideId: string, targetFolderId: string | null = null) {
    const store = this.getStore();
    const guide = store.guides.find(g => g.id === guideId);
    if (guide) {
      const newGuide = {
        ...guide,
        id: uuidv4(),
        title: `${guide.title} (Copia)`,
        folderId: targetFolderId !== null ? targetFolderId : guide.folderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.guides.push(newGuide);
      this.saveStore(store);
      return newGuide;
    }
  },

  copyFolder(folderId: string, targetParentId: string | null = null) {
    const store = this.getStore();
    const folder = store.folders.find(f => f.id === folderId);
    if (folder) {
      const newFolderId = uuidv4();
      const newFolder: Folder = {
        ...folder,
        id: newFolderId,
        name: `${folder.name} (Copia)`,
        parentId: targetParentId !== null ? targetParentId : folder.parentId,
      };
      store.folders.push(newFolder);
      
      // Copy child folders
      const childFolders = store.folders.filter(f => f.parentId === folderId);
      // Wait, we need to avoid infinite loop or duplicate in store.
      // We'll call saveStore at the end.
      this.saveStore(store); // Save current so recursive calls can see it
      
      childFolders.forEach(cf => this.copyFolder(cf.id, newFolderId));
      
      // Copy child guides
      const childGuides = store.guides.filter(g => g.folderId === folderId);
      childGuides.forEach(cg => this.copyGuide(cg.id, newFolderId));
      
      return newFolder;
    }
  }
};
