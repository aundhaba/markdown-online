
import React, { useState } from 'react';
import { Note, FilterType, NoteFilter } from '../types';
import { Icons } from './Icons';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  filter: NoteFilter;
  onMenuClick: () => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  filter,
  onMenuClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = notes.filter(note => {
    // 1. Text Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!note.content.toLowerCase().includes(q)) return false;
    }

    // 2. Trash Filter
    if (filter.type === FilterType.TRASH) return note.isTrashed;
    if (note.isTrashed) return false;

    // 3. Tag Filter
    if (filter.type === FilterType.TAG && filter.tag) {
      return note.tags.includes(filter.tag);
    }

    // 4. Folder Filter
    if (filter.type === FilterType.FOLDER && filter.folderId) {
      return note.folderId === filter.folderId;
    }

    return true;
  });

  const getTitleAndPreview = (content: string) => {
    const lines = content.trim().split('\n');
    const title = lines[0]?.replace(/^#+\s/, '') || 'Untitled Note';
    const preview = lines.slice(1).join(' ').substring(0, 120) || 'No additional text';
    return { title, preview };
  };

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    if (now.getFullYear() !== d.getFullYear()) return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getFilterLabel = () => {
    switch(filter.type) {
      case FilterType.ALL: return 'All Notes';
      case FilterType.TRASH: return 'Trash';
      case FilterType.TAG: return `# ${filter.tag}`;
      case FilterType.FOLDER: return 'Folder'; 
      default: return 'Notes';
    }
  };

  return (
    <div className="flex flex-col h-full bg-theme-list border-r border-theme-border w-full md:w-[350px] flex-shrink-0 transition-colors duration-300">
      {/* Header & Search */}
      <div className="h-16 flex items-center px-4 gap-3 bg-theme-list shrink-0 pt-2 transition-colors duration-300">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-text-secondary hover:text-text-main transition-colors"
        >
          <Icons.Menu size={24} />
        </button>
        
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icons.Search className="text-text-secondary group-focus-within:text-theme-primary transition-colors" size={16} />
          </div>
          <input 
            type="text" 
            placeholder="Search notes" 
            className="block w-full pl-10 pr-3 py-2 border-none rounded-xl bg-theme-main text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-theme-primary/20 shadow-sm text-sm font-medium transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button 
          onClick={onCreateNote}
          className="p-2 bg-theme-main text-theme-primary border border-theme-border rounded-xl shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 group"
          aria-label="Create note"
        >
          <Icons.Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Filter Title */}
      <div className="px-5 py-2">
        <h2 className="text-xs font-bold text-text-secondary opacity-60 uppercase tracking-wider flex items-center justify-between">
          <span>{getFilterLabel()}</span>
          <span className="font-normal opacity-50">{filteredNotes.length}</span>
        </h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 hide-scrollbar space-y-2">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-text-secondary opacity-50">
             <div className="w-16 h-16 bg-theme-border rounded-full flex items-center justify-center mb-4 opacity-50">
                <Icons.Search size={32} />
             </div>
             <p className="text-sm font-medium">No notes found</p>
          </div>
        ) : (
          filteredNotes.map(note => {
            const { title, preview } = getTitleAndPreview(note.content);
            const isSelected = selectedNoteId === note.id;
            
            return (
              <div 
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`
                  group relative p-4 cursor-pointer rounded-xl transition-all duration-200
                  ${isSelected 
                    ? 'bg-theme-main shadow-soft ring-1 ring-black/5 z-10' 
                    : 'bg-transparent hover:bg-theme-main/60 hover:shadow-sm'}
                `}
              >
                {/* Selection Indicator */}
                {isSelected && <div className="absolute left-0 top-3 bottom-3 w-1 bg-theme-primary rounded-r-full" />}

                <div className="flex justify-between items-start mb-1.5 pl-2">
                  <h3 className={`font-bold text-[15px] truncate pr-2 leading-tight ${isSelected ? 'text-text-main' : 'text-text-main/80'}`}>
                    {title}
                  </h3>
                  {note.isPinned && (
                    <Icons.Pin size={12} className="text-theme-primary shrink-0 mt-1" fill="currentColor" />
                  )}
                </div>
                
                <p className={`text-[13px] leading-relaxed line-clamp-2 pl-2 ${isSelected ? 'text-text-secondary' : 'text-text-secondary/70'}`}>
                  {preview}
                </p>
                
                <div className="flex items-center justify-between mt-3 pl-2">
                  <span className="text-[11px] text-text-secondary opacity-60 font-medium">{formatDate(note.updatedAt)}</span>
                  <div className="flex gap-1.5">
                    {note.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] bg-theme-bg text-theme-text px-2 py-0.5 rounded-full font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
