"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ProjectFormData,
  AnalysisResult,
  GeneratedOutput,
  HistoryEntry,
} from "./types";

interface DashboardStore {
  // 현재 세션 상태
  formData: ProjectFormData;
  analysis: AnalysisResult | null;
  chosenFramework: string;
  output: GeneratedOutput | null;

  // 기록
  history: HistoryEntry[];

  // 액션
  setFormData: (data: Partial<ProjectFormData>) => void;
  setAnalysis: (analysis: AnalysisResult, recommendedFw: string) => void;
  setChosenFramework: (fw: string) => void;
  setOutput: (output: GeneratedOutput) => void;
  saveToHistory: () => void;
  resetSession: () => void;
  deleteHistory: (id: string) => void;
}

const DEFAULT_FORM: ProjectFormData = {
  title: "",
  purpose: "",
  instructions: "",
  references: "",
  notes: "",
  needs_test: false,
  is_longterm: false,
  needs_ux: false,
  needs_security: false,
};

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      formData: DEFAULT_FORM,
      analysis: null,
      chosenFramework: "",
      output: null,
      history: [],

      setFormData: (data) =>
        set((state) => ({ formData: { ...state.formData, ...data } })),

      setAnalysis: (analysis, recommendedFw) =>
        set({ analysis, chosenFramework: recommendedFw }),

      setChosenFramework: (fw) => set({ chosenFramework: fw }),

      setOutput: (output) => set({ output }),

      saveToHistory: () => {
        const { formData, analysis, chosenFramework, output, history } = get();
        if (!analysis || !output) return;
        const entry: HistoryEntry = {
          id: Date.now().toString(),
          title: formData.title,
          framework: chosenFramework,
          date: new Date().toLocaleDateString("ko-KR"),
          formData,
          analysis,
          output,
        };
        set({ history: [entry, ...history] });
      },

      resetSession: () =>
        set({ formData: DEFAULT_FORM, analysis: null, chosenFramework: "", output: null }),

      deleteHistory: (id) =>
        set((state) => ({ history: state.history.filter((h) => h.id !== id) })),
    }),
    {
      name: "jh-harness-storage",
      partialize: (state) => ({ history: state.history }),
    }
  )
);
