interface UndoAction {
  id: string;
  action: string;
  timestamp: number;
  data: unknown;
}

const MAX_UNDO_ACTIONS = 10;
let undoStack: UndoAction[] = [];

export function addToUndoStack(action: string, data: unknown): void {
  undoStack.unshift({
    id: Date.now().toString(),
    action,
    timestamp: Date.now(),
    data,
  });
  if (undoStack.length > MAX_UNDO_ACTIONS) {
    undoStack = undoStack.slice(0, MAX_UNDO_ACTIONS);
  }
}

export function getUndoStack(): UndoAction[] {
  return undoStack;
}

export function clearUndoStack(): void {
  undoStack = [];
}

export function canUndo(): boolean {
  return undoStack.length > 0;
}

export function getLastUndoAction(): UndoAction | null {
  return undoStack[0] ?? null;
}

export function removeUndoAction(id: string): void {
  undoStack = undoStack.filter((action) => action.id !== id);
}
