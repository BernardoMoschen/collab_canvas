import * as Y from 'yjs'

let _undoManager: Y.UndoManager | null = null

export function initUndoManager(shapes: Y.Array<Y.Map<unknown>>) {
  _undoManager = new Y.UndoManager(shapes, { captureTimeout: 500 })
}

export function undo() { _undoManager?.undo() }
export function redo() { _undoManager?.redo() }
export function canUndo(): boolean { return (_undoManager?.undoStack.length ?? 0) > 0 }
export function canRedo(): boolean { return (_undoManager?.redoStack.length ?? 0) > 0 }
export function getUndoManager() { return _undoManager }
