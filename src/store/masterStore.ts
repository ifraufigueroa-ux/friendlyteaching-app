// FriendlyTeaching.cl — Master monitor store
import { create } from 'zustand';

interface MasterState {
  viewingTeacherId: string | null;
  viewingTeacherName: string | null;
  setViewingTeacher: (id: string, name: string) => void;
  clearViewingTeacher: () => void;
}

export const useMasterStore = create<MasterState>((set) => ({
  viewingTeacherId: null,
  viewingTeacherName: null,
  setViewingTeacher: (id, name) => set({ viewingTeacherId: id, viewingTeacherName: name }),
  clearViewingTeacher: () => set({ viewingTeacherId: null, viewingTeacherName: null }),
}));
