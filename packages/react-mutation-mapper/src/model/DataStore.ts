export interface DataStore {
  setPositionSelected: (position:number, newVal:boolean) => void;
  setPositionHighlighted: (position:number, newVal:boolean) => void;
  clearSelectedPositions: () => void;
  clearHighlightedPositions: () => void;
  clearDataSelectFilter: () => void;
  clearDataHighlightFilter: () => void;
  isPositionSelected: (position:number) => boolean;
  isPositionHighlighted: (position:number) => boolean;
}
