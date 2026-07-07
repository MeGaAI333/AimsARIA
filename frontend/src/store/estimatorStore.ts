import { create } from 'zustand';
import type { Material, Accessory, Project, Quote, FenceSpecification } from '../../../shared/types';

interface EstimatorState {
  materials: Material[];
  accessories: Accessory[];
  currentProject: Project | null;
  currentQuote: Quote | null;
  specification: FenceSpecification | null;

  // Actions
  setMaterials: (materials: Material[]) => void;
  setAccessories: (accessories: Accessory[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentQuote: (quote: Quote | null) => void;
  setSpecification: (spec: FenceSpecification) => void;
  updateSpecification: (spec: Partial<FenceSpecification>) => void;
  reset: () => void;
}

const initialSpecification: FenceSpecification = {
  materialId: '',
  color: '',
  height: 4,
  length: 50,
  width: 50,
  accessories: [],
  gateCount: 1,
  gateWidth: 4,
};

export const useEstimatorStore = create<EstimatorState>((set) => ({
  materials: [],
  accessories: [],
  currentProject: null,
  currentQuote: null,
  specification: initialSpecification,

  setMaterials: (materials) => set({ materials }),
  setAccessories: (accessories) => set({ accessories }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentQuote: (quote) => set({ currentQuote: quote }),

  setSpecification: (spec) => set({ specification: spec }),

  updateSpecification: (partial) =>
    set((state) => ({
      specification: state.specification ? { ...state.specification, ...partial } : null,
    })),

  reset: () =>
    set({
      currentProject: null,
      currentQuote: null,
      specification: initialSpecification,
    }),
}));
