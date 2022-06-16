const unWatches: Function[] = [];

export function addUnWatch(unWatcher: Function) {
  unWatches.push(unWatcher);
}

export function unwatch() {
  unWatches.forEach((unWatch) => unWatch());
}
