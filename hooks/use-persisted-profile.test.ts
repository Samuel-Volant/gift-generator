// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePersistedProfile } from "./use-persisted-profile";
import type { GiftIdea } from "@/types";

function makeGift(id: string, title: string): GiftIdea {
  return { id, emoji: "🎁", category: "Catégorie", title, reasoning: "r", price: "10€" };
}

describe("usePersistedProfile — cartes supprimées", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("addDeletedGifts préfixe les cartes avec dismissedAt", () => {
    const { result } = renderHook(() => usePersistedProfile());

    act(() => {
      result.current.addDeletedGifts([makeGift("a", "Titre A")]);
    });

    expect(result.current.deletedGifts).toHaveLength(1);
    expect(result.current.deletedGifts[0].id).toBe("a");
    expect(typeof result.current.deletedGifts[0].dismissedAt).toBe("number");
  });

  it("déduplique par id et garde le dernier dismissal, préfixe les plus récents", () => {
    const { result } = renderHook(() => usePersistedProfile());

    act(() => {
      result.current.addDeletedGifts([makeGift("a", "A"), makeGift("b", "B")]);
    });
    act(() => {
      result.current.addDeletedGifts([makeGift("a", "A reproposée"), makeGift("c", "C")]);
    });

    const ids = result.current.deletedGifts.map((g) => g.id);
    expect(ids).toEqual(["a", "c", "b"]);
    expect(result.current.deletedGifts[0].title).toBe("A reproposée");
  });

  it("restoreDeletedGift réinsère la carte dans le grid et l'enlève de la collection", () => {
    const { result } = renderHook(() => usePersistedProfile());

    act(() => {
      result.current.appendGifts([makeGift("a", "Titre A")]);
    });
    act(() => {
      result.current.addDeletedGifts([makeGift("a", "Titre A")]);
      result.current.restoreDeletedGift("a");
    });

    expect(result.current.deletedGifts).toHaveLength(0);
    expect(result.current.giftResults.map((g) => g.id)).toContain("a");
  });

  it("restoreDeletedGift inconnu est no-op", () => {
    const { result } = renderHook(() => usePersistedProfile());

    act(() => {
      result.current.restoreDeletedGift("nope");
    });

    expect(result.current.deletedGifts).toHaveLength(0);
  });

  it("clearAll vide aussi deletedGifts", () => {
    const { result } = renderHook(() => usePersistedProfile());

    act(() => {
      result.current.addDeletedGifts([makeGift("a", "A")]);
    });
    expect(result.current.deletedGifts).toHaveLength(1);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.deletedGifts).toHaveLength(0);
  });
});