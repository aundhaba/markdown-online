
export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface Note {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  isTrashed: boolean;
  tags: string[];
  folderId?: string | null;
}

export interface AIResponse {
  text: string;
  isError?: boolean;
}

export type ViewMode = 'list' | 'editor';

export enum FilterType {
  ALL = 'NOTES',
  TRASH = 'TRASH',
  TAG = 'TAG',
  FOLDER = 'FOLDER'
}

export interface NoteFilter {
  type: FilterType;
  tag?: string;
  folderId?: string;
}

export type Theme = 'purple' | 'red';
export type Mode = 'light' | 'dark';
