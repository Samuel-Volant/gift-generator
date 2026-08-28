// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFavorites } from "./use-favorites";

describe("useFavorites", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with empty favorites", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite("gift-1")).toBe(false);
  });

  it("toggles a favorite on and off", () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite("gift-1");
    });

    expect(result.current.favorites).toEqual(["gift-1"]);
    expect(result.current.isFavorite("gift-1")).toBe(true);

    act(() => {
      result.current.toggleFavorite("gift-1");
    });

    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite("gift-1")).toBe(false);
  });

  it("manages multiple favorites", () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite("gift-1");
      result.current.toggleFavorite("gift-2");
    });

    expect(result.current.favorites).toContain("gift-1");
    expect(result.current.favorites).toContain("gift-2");
    expect(result.current.favorites).toHaveLength(2);

    act(() => {
      result.current.toggleFavorite("gift-1");
    });

    expect(result.current.favorites).toEqual(["gift-2"]);
    expect(result.current.isFavorite("gift-1")).toBe(false);
    expect(result.current.isFavorite("gift-2")).toBe(true);
  });
});
