/**
 *
 * Remove file suffix
 * @export
 * @param {string} path
 * @return {*}  {string}
 */
export function removeExtension(path: string): string {
  return path.substring(0, path.lastIndexOf('.')) || path;
}
