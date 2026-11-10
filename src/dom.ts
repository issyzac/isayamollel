/** Find an element that must exist. Fails loudly, so a renamed id is caught at once. */
export function must<T extends Element>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector);
  if (el === null) throw new Error(`Missing element: ${selector}`);
  return el;
}
