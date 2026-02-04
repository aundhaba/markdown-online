
import { Note, Folder } from '../types';

const STORAGE_KEY_NOTES = 'bearclone_notes_v2';
const STORAGE_KEY_FOLDERS = 'bearclone_folders_v1';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

class StorageService {
  // --- Notes ---
  private getNotesFromStorage(): Note[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to parse notes", e);
      return [];
    }
  }

  private saveNotesToStorage(notes: Note[]) {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error("Failed to save notes", e);
    }
  }

  private extractTags(content: string): string[] {
    const hashTagRegex = /#([\w\u4e00-\u9fa5]+)/g;
    const matches = content.match(hashTagRegex);
    if (!matches) return [];
    return Array.from(new Set(matches.map(tag => tag.substring(1))));
  }

  async getAllNotes(): Promise<Note[]> {
    await delay(50);
    return this.getNotesFromStorage().sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async createNote(content: string = '', folderId: string | null = null): Promise<Note> {
    const notes = this.getNotesFromStorage();
    const newNote: Note = {
      id: generateId(),
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      isTrashed: false,
      tags: this.extractTags(content),
      folderId: folderId
    };
    notes.unshift(newNote);
    this.saveNotesToStorage(notes);
    return newNote;
  }

  async updateNote(id: string, content: string, folderId?: string | null): Promise<Note | null> {
    const notes = this.getNotesFromStorage();
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;

    const updatedNote = {
      ...notes[index],
      content,
      updatedAt: Date.now(),
      tags: this.extractTags(content)
    };

    if (folderId !== undefined) {
      updatedNote.folderId = folderId;
    }

    notes[index] = updatedNote;
    this.saveNotesToStorage(notes);
    return updatedNote;
  }

  async togglePin(id: string): Promise<Note | null> {
    const notes = this.getNotesFromStorage();
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;

    notes[index].isPinned = !notes[index].isPinned;
    this.saveNotesToStorage(notes);
    return notes[index];
  }

  async moveToTrash(id: string): Promise<void> {
    const notes = this.getNotesFromStorage();
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index].isTrashed = true;
      notes[index].isPinned = false;
      this.saveNotesToStorage(notes);
    }
  }

  async restoreFromTrash(id: string): Promise<void> {
    const notes = this.getNotesFromStorage();
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index].isTrashed = false;
      this.saveNotesToStorage(notes);
    }
  }

  async deletePermanently(id: string): Promise<void> {
    let notes = this.getNotesFromStorage();
    notes = notes.filter(n => n.id !== id);
    this.saveNotesToStorage(notes);
  }

  // --- Tags ---
  async getTags(): Promise<{ tag: string; count: number }[]> {
    const notes = this.getNotesFromStorage();
    const tagMap = new Map<string, number>();

    notes.forEach(note => {
      if (!note.isTrashed) {
        note.tags.forEach(tag => {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        });
      }
    });

    return Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count }));
  }

  async renameTag(oldTag: string, newTag: string): Promise<void> {
    const notes = this.getNotesFromStorage();
    const regex = new RegExp(`#${oldTag}(?![\\w\\u4e00-\\u9fa5])`, 'g');
    
    let updated = false;
    const newNotes = notes.map(note => {
      if (note.tags.includes(oldTag)) {
        updated = true;
        const newContent = note.content.replace(regex, `#${newTag}`);
        return {
          ...note,
          content: newContent,
          tags: this.extractTags(newContent),
          updatedAt: Date.now()
        };
      }
      return note;
    });

    if (updated) {
      this.saveNotesToStorage(newNotes);
    }
  }

  async deleteTag(tagToDelete: string): Promise<void> {
    const notes = this.getNotesFromStorage();
    const regex = new RegExp(`#${tagToDelete}(?![\\w\\u4e00-\\u9fa5])`, 'g');
    
    let updated = false;
    const newNotes = notes.map(note => {
      if (note.tags.includes(tagToDelete)) {
        updated = true;
        // Remove the tag and potential trailing space
        const newContent = note.content.replace(regex, '').replace(/\s{2,}/g, ' ');
        return {
          ...note,
          content: newContent,
          tags: this.extractTags(newContent),
          updatedAt: Date.now()
        };
      }
      return note;
    });

    if (updated) {
      this.saveNotesToStorage(newNotes);
    }
  }

  // --- Folders ---
  private getFoldersFromStorage(): Folder[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FOLDERS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to parse folders", e);
      return [];
    }
  }

  private saveFoldersToStorage(folders: Folder[]) {
    try {
      localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
    } catch (e) {
      console.error("Failed to save folders", e);
    }
  }

  async getAllFolders(): Promise<Folder[]> {
    await delay(20);
    return this.getFoldersFromStorage().sort((a, b) => a.name.localeCompare(b.name));
  }

  async createFolder(name: string, parentId: string | null = null): Promise<Folder> {
    const folders = this.getFoldersFromStorage();
    const newFolder: Folder = {
      id: generateId(),
      name,
      parentId,
      createdAt: Date.now()
    };
    folders.push(newFolder);
    this.saveFoldersToStorage(folders);
    return newFolder;
  }

  async updateFolder(id: string, name: string): Promise<void> {
    const folders = this.getFoldersFromStorage();
    const index = folders.findIndex(f => f.id === id);
    if (index !== -1) {
      folders[index].name = name;
      this.saveFoldersToStorage(folders);
    }
  }

  async deleteFolder(id: string): Promise<void> {
    let folders = this.getFoldersFromStorage();
    
    let notes = this.getNotesFromStorage();
    let updatedNotes = false;
    notes = notes.map(n => {
      if (n.folderId === id) {
        updatedNotes = true;
        return { ...n, folderId: null };
      }
      return n;
    });
    if (updatedNotes) this.saveNotesToStorage(notes);

    let updatedFolders = false;
    folders = folders.map(f => {
      if (f.parentId === id) {
        updatedFolders = true;
        return { ...f, parentId: null };
      }
      return f;
    });

    folders = folders.filter(f => f.id !== id);
    this.saveFoldersToStorage(folders);
  }
}

export const storage = new StorageService();
