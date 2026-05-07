const MAX_HISTORY_LENGTH = 50;

export function createSkeletonPoseHistory() {
  return {
    past: [],
    future: [],
  };
}

export function pushSkeletonPoseHistory(history, snapshot) {
  return {
    past: [...history.past, snapshot].slice(-MAX_HISTORY_LENGTH),
    future: [],
  };
}

export function undoSkeletonPoseHistory(history, currentSnapshot) {
  const snapshot = history.past.at(-1) ?? null;

  if (!snapshot) {
    return { history, snapshot: null };
  }

  return {
    history: {
      past: history.past.slice(0, -1),
      future: [currentSnapshot, ...history.future],
    },
    snapshot,
  };
}

export function redoSkeletonPoseHistory(history, currentSnapshot) {
  const snapshot = history.future[0] ?? null;

  if (!snapshot) {
    return { history, snapshot: null };
  }

  return {
    history: {
      past: [...history.past, currentSnapshot].slice(-MAX_HISTORY_LENGTH),
      future: history.future.slice(1),
    },
    snapshot,
  };
}
