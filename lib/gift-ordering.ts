/**
 * Ordre d'insertion des cadeaux — issue #24
 * Les nouvelles cartes doivent apparaître en haut de liste (prepend), pas en bas.
 */
export function mergeGiftResults<T>(prev: T[], next: T[]): T[] {
  return [...next, ...prev];
}
