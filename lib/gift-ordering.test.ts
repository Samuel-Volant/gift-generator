import { describe, it, expect } from "vitest";
import { mergeGiftResults } from "./gift-ordering";

describe("mergeGiftResults — issue #24: nouvelles cartes en haut", () => {
  it("place les nouveaux cadeaux au début (prepend)", () => {
    const prev = [{ id: "1" }, { id: "2" }];
    const next = [{ id: "3" }, { id: "4" }];
    const result = mergeGiftResults(prev, next);
    expect(result).toEqual([{ id: "3" }, { id: "4" }, { id: "1" }, { id: "2" }]);
  });

  it("gère prev vide", () => {
    const prev: { id: string }[] = [];
    const next = [{ id: "a" }];
    expect(mergeGiftResults(prev, next)).toEqual([{ id: "a" }]);
  });

  it("gère next vide", () => {
    const prev = [{ id: "x" }];
    const next: { id: string }[] = [];
    expect(mergeGiftResults(prev, next)).toEqual([{ id: "x" }]);
  });

  it("préserve l'ordre relatif interne des deux groupes", () => {
    const prev = [{ id: "old1" }, { id: "old2" }];
    const next = [{ id: "new1" }, { id: "new2" }, { id: "new3" }];
    const result = mergeGiftResults(prev, next);
    // new group first in order, then old group
    expect(result.map((g) => g.id)).toEqual(["new1", "new2", "new3", "old1", "old2"]);
  });

  it("première génération (prev vide) puis seconde génération en haut", () => {
    // Simule deux générations successives
    let gifts: { id: string }[] = [];
    gifts = mergeGiftResults(gifts, [{ id: "1" }, { id: "2" }]);
    expect(gifts.map((g) => g.id)).toEqual(["1", "2"]);
    gifts = mergeGiftResults(gifts, [{ id: "3" }, { id: "4" }]);
    // 3,4 doivent être devant 1,2
    expect(gifts.map((g) => g.id)).toEqual(["3", "4", "1", "2"]);
  });
});
