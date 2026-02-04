
import React, { useState, useEffect, useRef } from 'react';
import { Note, Folder } from '../types';
import { Icons } from './Icons';
import { generateNoteContent } from '../services/gemini';

interface EditorProps {
  note: Note | null;
  folders: Folder[];
  onUpdate: (id: string, content: string, folderId?: string | null) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onTogglePin: (id: string) => void;
  onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  note,
  folders,
  onUpdate,
  onDelete,
  onRestore,
  onDeletePermanently,
  onTogglePin,
  onBack
}) => {
  const [content, setContent] = useState('');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setContent(note.content);
      if (textareaRef.current) {
         // Reset scroll or selection if needed, but keeping selection logic simple
      }
    } else {
      setContent('');
    }
  }, [note?.id]); 

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (note) {
      onUpdate(note.id, newContent);
    }
  };

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current || !note) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    onUpdate(note.id, newText);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 10);
  };

  const handleFolderChange = (folderId: string | null) => {
    if (note) {
      onUpdate(note.id, content, folderId);
      setIsFolderMenuOpen(false);
    }
  };

  const handleAIAction = async (mode: 'continue' | 'summarize' | 'improve') => {
    if (!note) return;
    setAiLoading(true);
    
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart || content.length;
    const end = textarea?.selectionEnd || content.length;
    const selectedText = content.substring(start, end);
    const context = selectedText.length > 5 ? selectedText : content;
    
    const result = await generateNoteContent(
      mode === 'continue' ? "Continue writing this note." : mode === 'summarize' ? "Summarize this." : "Improve this text.",
      context,
      mode
    );

    setAiLoading(false);
    setIsAiOpen(false);

    if (result && !result.startsWith("Error")) {
      let newContent = content;
      if (mode === 'continue') {
        newContent = content + (content.endsWith(' ') ? '' : ' ') + result;
      } else if (mode === 'improve' && selectedText.length > 5) {
        newContent = content.substring(0, start) + result + content.substring(end);
      } else {
        newContent = content + "\n\n**AI Summary:**\n" + result;
      }
      setContent(newContent);
      onUpdate(note.id, newContent);
    }
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-theme-main text-text-secondary">
        <div className="w-24 h-24 rounded-full bg-theme-bg flex items-center justify-center mb-6 opacity-50">
           <Icons.Note size={48} className="text-theme-primary" />
        </div>
        <p className="text-lg font-serif italic opacity-60">Select a note to start writing</p>
      </div>
    );
  }

  const dateStr = new Date(note.updatedAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const currentFolder = folders.find(f => f.id === note.folderId);

  return (
    <div className="flex-1 flex flex-col h-full bg-theme-main relative text-text-main transition-colors duration-300">
      
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 md:px-10 shrink-0 border-b border-transparent hover:border-theme-border transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 text-text-secondary hover:bg-theme-bg rounded-full transition-colors">
            <Icons.Back size={20} />
          </button>
          
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-text-secondary opacity-60 font-medium">
              Last edited {dateStr}
            </span>
            
            {/* Folder Selector */}
            {!note.isTrashed && (
              <div className="relative z-20">
                <button 
                  onClick={() => setIsFolderMenuOpen(!isFolderMenuOpen)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-main transition-colors mt-0.5"
                >
                  <Icons.Folder size={12} />
                  <span>{currentFolder ? currentFolder.name : 'All Notes'}</span>
                  <Icons.ChevronDown size={10} />
                </button>

                {isFolderMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-theme-main rounded-xl shadow-float border border-theme-border py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-2 text-[10px] font-bold text-text-secondary opacity-50 uppercase tracking-wider">Move to...</div>
                    <div className="max-h-60 overflow-y-auto">
                      <button 
                        onClick={() => handleFolderChange(null)}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-theme-bg ${!note.folderId ? 'text-theme-primary font-medium' : 'text-text-main'}`}
                      >
                         <Icons.Note size={14} /> All Notes (Root)
                         {!note.folderId && <Icons.Check size={14} className="ml-auto" />}
                      </button>
                      {folders.map(f => (
                        <button 
                          key={f.id}
                          onClick={() => handleFolderChange(f.id)}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-theme-bg ${note.folderId === f.id ? 'text-theme-primary font-medium' : 'text-text-main'}`}
                        >
                           <Icons.Folder size={14} /> {f.name}
                           {note.folderId === f.id && <Icons.Check size={14} className="ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tag Indicator */}
        <div className="hidden md:flex items-center gap-2 overflow-hidden px-4">
           {note.tags.length > 0 ? (
             note.tags.map(tag => (
               <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-theme-bg text-theme-text rounded-full text-[10px] font-bold">
                 <Icons.Tag size={10} /> {tag}
               </span>
             ))
           ) : (
             <span className="text-[10px] text-text-secondary opacity-50 italic flex items-center gap-1">
               Type <span className="font-bold">#tag</span> to tag
             </span>
           )}
        </div>

        <div className="flex items-center gap-2">
          {!note.isTrashed && (
            <>
              <button 
                onClick={() => setIsAiOpen(!isAiOpen)}
                className={`
                   group flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300
                   ${isAiOpen 
                     ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30' 
                     : 'bg-theme-main text-text-secondary border border-theme-border hover:border-theme-primary hover:text-theme-primary'}
                `}
              >
                <Icons.AI size={16} className={`${isAiOpen ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">AI Assist</span>
              </button>

              <button 
                onClick={() => onTogglePin(note.id)}
                className={`p-2 rounded-full transition-all duration-200 ${note.isPinned ? 'text-theme-primary bg-theme-bg' : 'text-text-secondary hover:text-text-main hover:bg-theme-bg'}`}
                title={note.isPinned ? "Unpin" : "Pin"}
              >
                <Icons.Pin size={18} className={note.isPinned ? "fill-current" : ""} />
              </button>
            </>
          )}

          {note.isTrashed ? (
             <div className="flex gap-2">
                <button 
                  onClick={() => onRestore(note.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 text-xs font-bold uppercase tracking-wide transition-colors"
                >
                  <Icons.Restore size={14} /> Restore
                </button>
                <button 
                  onClick={() => onDeletePermanently(note.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 text-xs font-bold uppercase tracking-wide transition-colors"
                >
                  <Icons.Close size={14} /> Delete
                </button>
             </div>
          ) : (
            <button 
              onClick={() => onDelete(note.id)}
              className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
              title="Move to trash"
            >
              <Icons.Trash size={18} />
            </button>
          )}
        </div>
      </div>

      {/* AI Popup Menu */}
      {isAiOpen && (
        <div className="absolute top-16 right-10 z-30 w-72 bg-theme-main/90 backdrop-blur-xl rounded-2xl shadow-float border border-theme-border p-3 animate-in fade-in slide-in-from-top-4 duration-300">
           {aiLoading ? (
             <div className="flex flex-col items-center justify-center p-6 text-theme-primary gap-3">
               <div className="w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
               <span className="text-sm font-medium animate-pulse">Generating magic...</span>
             </div>
           ) : (
             <div className="flex flex-col gap-1">
               <div className="px-3 py-2 text-xs font-bold text-text-secondary opacity-50 uppercase tracking-wider">AI Tools</div>
               <button onClick={() => handleAIAction('continue')} className="w-full text-left px-3 py-2.5 hover:bg-theme-bg text-text-main rounded-xl text-sm flex items-center gap-3 transition-all">
                 <div className="p-1.5 bg-theme-bg text-theme-primary rounded-lg"><Icons.Plus size={14} /></div>
                 Continue Writing
               </button>
               <button onClick={() => handleAIAction('improve')} className="w-full text-left px-3 py-2.5 hover:bg-theme-bg text-text-main rounded-xl text-sm flex items-center gap-3 transition-all">
                 <div className="p-1.5 bg-theme-bg text-theme-primary rounded-lg"><Icons.AI size={14} /></div>
                 Fix Grammar & Flow
               </button>
               <button onClick={() => handleAIAction('summarize')} className="w-full text-left px-3 py-2.5 hover:bg-theme-bg text-text-main rounded-xl text-sm flex items-center gap-3 transition-all">
                 <div className="p-1.5 bg-theme-bg text-theme-primary rounded-lg"><Icons.Menu size={14} /></div>
                 Summarize
               </button>
             </div>
           )}
        </div>
      )}

      {/* Writing Area */}
      <div className="flex-1 overflow-y-auto cursor-text pb-14" onClick={() => textareaRef.current?.focus()}>
        <div className="max-w-3xl mx-auto h-full px-6 md:px-10 py-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            disabled={note.isTrashed}
            placeholder={note.isTrashed ? "Restore note to edit content" : "# Untitled\nWrite something beautiful... #idea"}
            className="w-full h-full resize-none focus:outline-none bg-transparent font-serif text-[18px] md:text-[20px] leading-[1.8] text-text-main placeholder-text-secondary/50 selection:bg-theme-bg selection:text-theme-text"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Quick Access Toolbar (Fixed Bottom) */}
      {!note.isTrashed && (
        <div className="h-12 border-t border-theme-border bg-theme-main/95 backdrop-blur shrink-0 flex items-center overflow-x-auto hide-scrollbar px-2 shadow-sm">
          <div className="flex items-center gap-1 mx-auto max-w-3xl w-full">
            <ToolbarBtn icon={<Icons.Heading size={16} />} onClick={() => insertText('# ', '')} label="H1" />
            <ToolbarBtn icon={<Icons.Heading size={14} />} onClick={() => insertText('## ', '')} label="H2" />
            <div className="w-[1px] h-6 bg-theme-border mx-1" />
            <ToolbarBtn icon={<Icons.Bold size={16} />} onClick={() => insertText('**', '**')} label="Bold" />
            <ToolbarBtn icon={<span className="font-serif italic font-bold text-sm">I</span>} onClick={() => insertText('*', '*')} label="Italic" />
            <ToolbarBtn icon={<span className="font-mono text-sm">~</span>} onClick={() => insertText('~~', '~~')} label="Strike" />
            <div className="w-[1px] h-6 bg-theme-border mx-1" />
            <ToolbarBtn icon={<Icons.List size={16} />} onClick={() => insertText('- ', '')} label="List" />
            <ToolbarBtn icon={<Icons.CheckSquare size={16} />} onClick={() => insertText('- [ ] ', '')} label="Todo" />
            <ToolbarBtn icon={<Icons.Quote size={16} />} onClick={() => insertText('> ', '')} label="Quote" />
            <div className="w-[1px] h-6 bg-theme-border mx-1" />
            <ToolbarBtn icon={<Icons.Code size={16} />} onClick={() => insertText('`', '`')} label="Code" />
            <ToolbarBtn icon={<Icons.Link size={16} />} onClick={() => insertText('[', '](url)')} label="Link" />
            <ToolbarBtn icon={<Icons.Tag size={16} />} onClick={() => insertText('#', '')} label="Tag" />
          </div>
        </div>
      )}
    </div>
  );
};

const ToolbarBtn = ({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    className="flex-shrink-0 w-10 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-theme-primary hover:bg-theme-bg transition-colors"
    title={label}
  >
    {icon}
  </button>
);
