import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { GuideList } from "./pages/GuideList";
import { EditorPage } from "./pages/EditorPage";
import { Sidebar } from "./components/Sidebar";
import { storage } from "./services/storage";
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';

const theme = createTheme({
  primaryColor: 'blue',
});

function App() {
  const [currentView, setCurrentView] = useState<"list" | "editor">("list");
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [markdownToImport, setMarkdownToImport] = useState<string | undefined>();

  const handleSelectGuide = (id: string) => {
    setActiveGuideId(id);
    setMarkdownToImport(undefined);
    setCurrentView("editor");
  };

  const handleNewGuide = (folderId: string | null = null) => {
    const newId = uuidv4();
    const newGuide = {
      id: newId,
      title: "",
      folderId,
      content: { type: "doc", content: [{ type: "paragraph" }] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveGuide(newGuide);
    setActiveGuideId(newId);
    setMarkdownToImport(undefined);
    setCurrentView("editor");
  };

  const handleImportMd = async (file: File) => {
    const text = await file.text();
    const h1Match = text.match(/^#\s+(.+)$/m);
    const title = h1Match ? h1Match[1] : file.name.replace(".md", "");
    
    const newId = uuidv4();
    const newGuide = {
      id: newId,
      title: title,
      folderId: null,
      content: { type: "doc", content: [{ type: "paragraph" }] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    storage.saveGuide(newGuide);
    setMarkdownToImport(text);
    setActiveGuideId(newId);
    setCurrentView("editor");
  };

  return (
    <MantineProvider theme={theme}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar 
          activeGuideId={activeGuideId} 
          onSelectGuide={handleSelectGuide} 
          onNewGuide={(fid) => handleNewGuide(fid || null)} 
        />
        
        <div className="flex-grow overflow-auto relative">
          {currentView === "list" ? (
            <GuideList
              onSelectGuide={handleSelectGuide}
              onNewGuide={(fid) => handleNewGuide(fid)}
              onImportMd={handleImportMd}
            />
          ) : (
            activeGuideId && (
              <EditorPage
                guideId={activeGuideId}
                initialMarkdown={markdownToImport}
                onBack={() => setCurrentView("list")}
              />
            )
          )}
        </div>
      </div>
    </MantineProvider>
  );
}

export default App;
