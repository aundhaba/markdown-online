
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { Editor } from './components/Editor';
import { storage } from './services/storage';
import { Note, NoteFilter, FilterType, Folder, Theme, Mode } from './types';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<NoteFilter>({ type: FilterType.ALL });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Theme & Mode State
  const [theme, setTheme] = useState<Theme>('purple');
  const [mode, setMode] = useState<Mode>('light');

  // Initial Data Load & Theme
  useEffect(() => {
    refreshData();
    
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    // Initialize Theme/Mode
    document.documentElement.setAttribute('data-theme', 'purple');
    document.documentElement.setAttribute('data-mode', 'light');

    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
       setMode('dark');
       document.documentElement.setAttribute('data-mode', 'dark');
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'purple' ? 'red' : 'purple';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    document.documentElement.setAttribute('data-mode', newMode);
  };

  const refreshData = async () => {
    const [fetchedNotes, fetchedFolders, fetchedTags] = await Promise.all([
      storage.getAllNotes(),
      storage.getAllFolders(),
      storage.getTags()
    ]);
    setNotes(fetchedNotes);
    setFolders(fetchedFolders);
    setTags(fetchedTags);
  };

  // --- Note Actions ---

  const handleCreateNote = async () => {
    const targetFolderId = filter.type === FilterType.FOLDER ? filter.folderId || null : null;
    const newNote = await storage.createNote("# New Note\nWrite something... #idea", targetFolderId);
    await refreshData();
    if (filter.type !== FilterType.FOLDER) {
        setFilter({ type: FilterType.ALL }); 
    }
    setSelectedNoteId(newNote.id);
  };

  const handleUpdateNote = async (id: string, content: string, folderId?: string | null) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content, updatedAt: Date.now(), ...(folderId !== undefined ? {folderId} : {}) } : n));
    await storage.updateNote(id, content, folderId);
    if (content.includes('#') || content.includes(' ')) {
       const newTags = await storage.getTags();
       setTags(newTags);
    }
  };

  const handleDeleteNote = async (id: string) => {
    await storage.moveToTrash(id);
    if (selectedNoteId === id) setSelectedNoteId(null);
    await refreshData();
  };

  const handleRestoreNote = async (id: string) => {
    await storage.restoreFromTrash(id);
    await refreshData();
  };

  const handleDeletePermanently = async (id: string) => {
    await storage.deletePermanently(id);
    if (selectedNoteId === id) setSelectedNoteId(null);
    await refreshData();
  };

  const handleTogglePin = async (id: string) => {
    await storage.togglePin(id);
    await refreshData();
  };

  // --- Folder Actions ---

  const handleCreateFolder = async (name: string, parentId: string | null) => {
    await storage.createFolder(name, parentId);
    await refreshData();
  };

  const handleRenameFolder = async (id: string, name: string) => {
    await storage.updateFolder(id, name);
    await refreshData();
  };

  const handleDeleteFolder = async (id: string) => {
    await storage.deleteFolder(id);
    if (filter.type === FilterType.FOLDER && filter.folderId === id) {
      setFilter({ type: FilterType.ALL });
    }
    await refreshData();
  };

  // --- Tag Actions ---
  const handleRenameTag = async (oldTag: string, newTag: string) => {
    await storage.renameTag(oldTag, newTag);
    // If we were filtering by the old tag, update filter to new tag
    if (filter.type === FilterType.TAG && filter.tag === oldTag) {
      setFilter({ type: FilterType.TAG, tag: newTag });
    }
    await refreshData();
    // Refresh current note if it was affected
    if (selectedNoteId) {
       const updatedNotes = await storage.getAllNotes();
       setNotes(updatedNotes);
    }
  };

  const handleDeleteTag = async (tag: string) => {
    await storage.deleteTag(tag);
    if (filter.type === FilterType.TAG && filter.tag === tag) {
      setFilter({ type: FilterType.ALL });
    }
    await refreshData();
    // Refresh current note if it was affected
    if (selectedNoteId) {
      const updatedNotes = await storage.getAllNotes();
      setNotes(updatedNotes);
    }
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;

  // View Logic
  const showList = !isMobile || (!selectedNoteId);
  const showEditor = !isMobile || (!!selectedNoteId);

  return (
    <div className="flex h-full w-full bg-theme-list overflow-hidden text-text-main font-sans transition-colors duration-300">
      
      <Sidebar 
        folders={folders}
        tags={tags}
        currentFilter={filter}
        onSelectFilter={(f) => {
          setFilter(f);
          setSelectedNoteId(null);
        }}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onRenameTag={handleRenameTag}
        onDeleteTag={handleDeleteTag}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        theme={theme}
        onToggleTheme={toggleTheme}
        mode={mode}
        onToggleMode={toggleMode}
      />

      <main className="flex-1 flex overflow-hidden relative transition-all duration-300">
        
        {/* Note List Column */}
        <div 
          className={`
            ${showList ? 'flex' : 'hidden'} 
            ${isMobile ? 'w-full' : 'w-auto'} 
            h-full flex-shrink-0 z-0
          `}
        >
          <NoteList 
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId}
            onCreateNote={handleCreateNote}
            filter={filter}
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>

        {/* Editor Column */}
        <div 
          className={`
            ${showEditor ? 'flex' : 'hidden'} 
            flex-1 h-full bg-theme-main z-10
            ${isMobile && showEditor ? 'absolute inset-0' : ''}
          `}
        >
          <Editor 
            note={selectedNote}
            folders={folders}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
            onRestore={handleRestoreNote}
            onDeletePermanently={handleDeletePermanently}
            onTogglePin={handleTogglePin}
            onBack={() => setSelectedNoteId(null)}
          />
        </div>

      </main>
    </div>
  );
};

export default App;
