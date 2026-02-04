
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { FilterType, NoteFilter, Folder, Theme, Mode } from '../types';

interface SidebarProps {
  folders: Folder[];
  tags: { tag: string; count: number }[];
  currentFilter: NoteFilter;
  onSelectFilter: (filter: NoteFilter) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameTag: (oldTag: string, newTag: string) => void;
  onDeleteTag: (tag: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  mode: Mode;
  onToggleMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  folders,
  tags, 
  currentFilter, 
  onSelectFilter, 
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onRenameTag,
  onDeleteTag,
  isOpen, 
  onClose,
  isMobile,
  theme,
  onToggleTheme,
  mode,
  onToggleMode
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  // Tag Menu State
  const [activeTagMenu, setActiveTagMenu] = useState<string | null>(null);
  const [tagRename, setTagRename] = useState<{old: string, new: string} | null>(null);

  // Creation State
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingFolder && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [isCreatingFolder]);

  // Folder Logic
  const toggleFolder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedFolders(newExpanded);
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreatingFolder(true);
    setNewFolderName('');
  };

  const submitNewFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), null);
    }
    setIsCreatingFolder(false);
    setNewFolderName('');
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitNewFolder();
    if (e.key === 'Escape') {
      setIsCreatingFolder(false);
      setNewFolderName('');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, folder: Folder) => {
    e.preventDefault();
    if (window.confirm(`Delete folder "${folder.name}"? Notes will be moved to root.`)) {
      onDeleteFolder(folder.id);
    }
  };

  const startRename = (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditName(folder.name);
  };

  const submitRename = (id: string) => {
    if (editName.trim()) {
      onRenameFolder(id, editName.trim());
    }
    setEditingFolderId(null);
  };

  // Tag Logic
  const handleTagContextMenu = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    setActiveTagMenu(activeTagMenu === tag ? null : tag);
  };

  const handleRenameTagClick = (tag: string) => {
    setTagRename({ old: tag, new: tag });
    setActiveTagMenu(null);
  };

  const submitTagRename = () => {
    if (tagRename && tagRename.new.trim() && tagRename.new !== tagRename.old) {
      onRenameTag(tagRename.old, tagRename.new.trim());
    }
    setTagRename(null);
  };

  const handleDeleteTagClick = (tag: string) => {
    if (window.confirm(`Delete tag #${tag}? This will remove the tag from all notes.`)) {
      onDeleteTag(tag);
    }
    setActiveTagMenu(null);
  };

  const baseClasses = `
    fixed inset-y-0 left-0 z-40 
    w-[260px] bg-sidebar-bg text-sidebar-text
    transform transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
    flex flex-col border-r border-transparent md:border-theme-border
  `;
  const visibilityClasses = isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full';
  const desktopClasses = "md:relative md:translate-x-0 md:shadow-none md:flex-shrink-0"; 

  const handleSelect = (filter: NoteFilter) => {
    onSelectFilter(filter);
    if (isMobile) onClose();
  };

  // Recursive Folder Renderer
  const renderFolderTree = (parentId: string | null, depth = 0) => {
    const childFolders = folders.filter(f => f.parentId === parentId);
    
    if (childFolders.length === 0 && parentId !== null) return null;

    return (
      <div className="flex flex-col">
        {childFolders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id);
          const isActive = currentFilter.type === FilterType.FOLDER && currentFilter.folderId === folder.id;
          const hasChildren = folders.some(f => f.parentId === folder.id);

          return (
            <div key={folder.id}>
              <div 
                className={`
                  group flex items-center justify-between px-4 py-2 my-0.5 mx-2 rounded-lg cursor-pointer transition-colors
                  ${isActive ? 'bg-sidebar-hover text-sidebar-textHover' : 'hover:bg-sidebar-hover text-sidebar-text hover:text-sidebar-textHover'}
                `}
                style={{ paddingLeft: `${depth * 16 + 16}px` }}
                onClick={() => handleSelect({ type: FilterType.FOLDER, folderId: folder.id })}
                onContextMenu={(e) => handleContextMenu(e, folder)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div 
                    onClick={(e) => hasChildren ? toggleFolder(e, folder.id) : null}
                    className={`p-0.5 rounded hover:bg-white/10 ${hasChildren ? 'visible' : 'invisible'}`}
                  >
                    {isExpanded ? <Icons.ChevronDown size={12} /> : <Icons.ChevronRight size={12} />}
                  </div>
                  
                  {editingFolderId === folder.id ? (
                    <input 
                      autoFocus
                      className="bg-black/20 text-white px-1 py-0.5 rounded text-sm w-full outline-none border border-theme-primary"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => submitRename(folder.id)}
                      onKeyDown={(e) => e.key === 'Enter' && submitRename(folder.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <Icons.Folder size={14} className={isActive ? 'text-white' : 'text-inherit'} />
                      <span className="truncate text-sm font-medium">{folder.name}</span>
                    </>
                  )}
                </div>

                {!editingFolderId && (
                  <button 
                    onClick={(e) => startRename(e, folder)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-white transition-opacity"
                    title="Rename"
                  >
                    <Icons.Edit size={12} />
                  </button>
                )}
              </div>
              
              {isExpanded && renderFolderTree(folder.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 backdrop-blur-[2px] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <div className={`${baseClasses} ${visibilityClasses} ${desktopClasses}`}>
        {/* Header */}
        <div className="pt-8 pb-6 px-6 flex items-center justify-between">
          <h1 className="text-white text-xl font-bold flex items-center gap-3 tracking-tight">
             <div className="bg-gradient-to-br from-theme-primary to-theme-hover text-white p-1.5 rounded-lg shadow-lg">
               <Icons.Note size={18} fill="currentColor" strokeWidth={2.5} />
             </div>
             <span className="font-serif italic text-white">BearClone</span>
          </h1>
          {isMobile && (
            <button onClick={onClose} className="p-2 -mr-2 hover:bg-sidebar-hover rounded-full text-gray-400 transition-colors">
              <Icons.Close size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-0 py-2 hide-scrollbar">
          
          {/* Main Links */}
          <div className="space-y-0.5 mb-6">
            <button
              onClick={() => handleSelect({ type: FilterType.ALL })}
              className={`w-[calc(100%-16px)] flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all ${currentFilter.type === FilterType.ALL ? 'bg-sidebar-hover text-sidebar-textHover' : 'hover:bg-sidebar-hover text-sidebar-text hover:text-sidebar-textHover'}`}
            >
              <Icons.Note size={18} />
              <span className="text-[15px] font-medium">All Notes</span>
            </button>
            <button
              onClick={() => handleSelect({ type: FilterType.TRASH })}
              className={`w-[calc(100%-16px)] flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all ${currentFilter.type === FilterType.TRASH ? 'bg-sidebar-hover text-sidebar-textHover' : 'hover:bg-sidebar-hover text-sidebar-text hover:text-sidebar-textHover'}`}
            >
              <Icons.Trash size={18} />
              <span className="text-[15px] font-medium">Trash</span>
            </button>
          </div>

          {/* Folders Section */}
          <div className="mb-6">
            <div className="px-6 mb-2 flex items-center justify-between group">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-sidebar-text opacity-70">
                Folders
              </span>
              <button 
                onClick={handleCreateClick} 
                className="text-sidebar-text hover:text-white transition-colors" 
                title="New Folder"
              >
                <Icons.FolderPlus size={14} />
              </button>
            </div>
            
            {/* Inline Creation Input */}
            {isCreatingFolder && (
               <div className="px-4 py-2 my-0.5 mx-2 bg-sidebar-hover rounded-lg flex items-center gap-2">
                  <Icons.Folder size={14} className="text-white shrink-0" />
                  <input
                    ref={createInputRef}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onBlur={submitNewFolder}
                    onKeyDown={handleCreateKeyDown}
                    placeholder="Folder Name"
                    className="bg-transparent text-white text-sm w-full outline-none placeholder-gray-500"
                  />
               </div>
            )}

            {folders.length === 0 && !isCreatingFolder ? (
              <div className="px-6 py-2 text-sm text-sidebar-text opacity-50 italic font-light cursor-pointer hover:text-white" onClick={handleCreateClick}>
                Click + to create folder
              </div>
            ) : (
              renderFolderTree(null)
            )}
          </div>

          {/* Tags Section */}
          <div className="pb-20"> {/* Padding for footer */}
            <div className="px-6 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-sidebar-text opacity-70">
                Tags
              </span>
            </div>
            
            {tagRename && (
               <div className="px-4 py-2 my-0.5 mx-2 bg-sidebar-hover rounded-lg flex items-center gap-2 mb-2">
                  <Icons.Tag size={14} className="text-white shrink-0" />
                  <input
                    autoFocus
                    value={tagRename.new}
                    onChange={(e) => setTagRename({...tagRename, new: e.target.value})}
                    onBlur={submitTagRename}
                    onKeyDown={(e) => e.key === 'Enter' && submitTagRename()}
                    className="bg-transparent text-white text-sm w-full outline-none"
                  />
               </div>
            )}

            <div className="space-y-0.5">
              {tags.map(({ tag, count }) => (
                <div key={tag} className="relative group">
                  <button
                    onClick={() => handleSelect({ type: FilterType.TAG, tag })}
                    onContextMenu={(e) => handleTagContextMenu(e, tag)}
                    className={`w-[calc(100%-16px)] flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-all ${currentFilter.type === FilterType.TAG && currentFilter.tag === tag ? 'bg-sidebar-hover text-sidebar-textHover' : 'hover:bg-sidebar-hover text-sidebar-text hover:text-sidebar-textHover'}`}
                  >
                    <Icons.Tag size={14} />
                    <span className="flex-1 text-left text-sm font-medium">{tag}</span>
                    <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded text-inherit opacity-70">{count}</span>
                    
                    {/* Context Menu Trigger (Desktop Hover) */}
                    <div 
                       onClick={(e) => { e.stopPropagation(); setActiveTagMenu(activeTagMenu === tag ? null : tag); }}
                       className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded"
                    >
                       <Icons.MoreVertical size={12} />
                    </div>
                  </button>

                  {/* Context Menu Popup */}
                  {activeTagMenu === tag && (
                    <div className="absolute right-4 top-full mt-1 z-50 w-32 bg-[#222] border border-[#444] rounded-lg shadow-xl overflow-hidden py-1">
                      <button 
                        onClick={() => handleRenameTagClick(tag)}
                        className="w-full text-left px-3 py-2 text-xs text-white hover:bg-theme-primary flex items-center gap-2"
                      >
                        <Icons.Edit size={12} /> Rename
                      </button>
                      <button 
                        onClick={() => handleDeleteTagClick(tag)}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/30 flex items-center gap-2"
                      >
                        <Icons.Trash size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer (Theme & Mode) */}
        <div className="p-4 border-t border-white/5 bg-sidebar-bg">
           <div className="flex gap-2">
             <button 
               onClick={onToggleTheme}
               className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sidebar-hover text-sidebar-text hover:text-white transition-all hover:bg-white/10"
               title="Change Color Theme"
             >
               <div className="p-1 rounded-full bg-gradient-to-br from-theme-primary to-theme-hover">
                 <Icons.Palette size={12} className="text-white" />
               </div>
               <span className="text-xs font-medium">{theme === 'purple' ? 'Purple' : 'Red'}</span>
             </button>

             <button 
               onClick={onToggleMode}
               className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sidebar-hover text-sidebar-text hover:text-white transition-all hover:bg-white/10"
               title="Toggle Dark Mode"
             >
               {mode === 'light' ? <Icons.Sun size={14} /> : <Icons.Moon size={14} />}
               <span className="text-xs font-medium">{mode === 'light' ? 'Light' : 'Dark'}</span>
             </button>
           </div>
        </div>
      </div>
    </>
  );
};
