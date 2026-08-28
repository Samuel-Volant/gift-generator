import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserProfile } from "@/types";

const VALID_GIFT_IDEAS = {
  gift_ideas: [
    { emoji: "🎲", category: "Jeux", title: "Jeu de société", reasoning: "- fun", price: "25€", tags_used: ["Jeux", "Cuisine"], archetype: "OBJET DURABLE" },
    { emoji: "🏺", category: "Atelier", title: "Atelier poterie", reasoning: "- manuel", price: "45€", tags_used: ["Cuisine", "Jeux"], archetype: "EXPERIENCE" },
    { emoji: "🍵", category: "Gourmand", title: "Coffret thé", reasoning: "- calme", price: "20€", tags_used: ["Jeux", "Cuisine"], archetype: "CONSOMMABLE" },
    { emoji: "📚", category: "Livre", title: "Livre art", reasoning: "- savoir", price: "18€", tags_used: ["Cuisine", "Jeux"], archetype: "SAVOIR" },
    { emoji: "🗓️", category: "Service", title: "Box mensuel", reasoning: "- fun récurrent", price: "15€", tags_used: ["Jeux", "Cuisine"], archetype: "SERVICE" },
  ],
};

const MOCK_PROFILE: UserProfile = {
  age: 30,
  genre: "homme",
  relation: "ami",
  pragmatiqueSentimental: 50,
  routineOriginalite: 50,
  calmeEnergie: 50,
  serieuxFun: 50,
  objetExperience: 50,
  interets: [{ id: "1", label: "Jeux", level: "expert" }],
  momentDeVie: [],
  roleGroupe: [],
  marquesTotem: [],
  profilAcheteur: "ne-se-prononce-pas",
  projets: [],
  plaintes: [],
  blacklist: [],
  budget: "moyen",
  intention: "fun",
};

const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn().mockReturnValue({ generateContent: mockGenerateContent });

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

vi.mock("@google/generative-ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@google/generative-ai")>();
  return {
    ...actual,
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
  };
});

const mockGroqCreate = vi.fn();

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockGroqCreate } },
  })),
}));

const { POST } = await import("./route");

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/generate-gifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GEMINI_API_KEY = "test-key";
  process.env.GROQ_API_KEY = "test-key";
});

describe("POST /api/generate-gifts — integration", () => {
  describe("200 OK", () => {
    it("returns gift ideas for Google provider", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(VALID_GIFT_IDEAS),
          candidates: [{ finishReason: "STOP" }],
        },
      });

      const res = await POST(makeRequest({ profile: MOCK_PROFILE, provider: "google" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.gift_ideas).toHaveLength(5);
      expect(body.gift_ideas[0].id).toBeDefined();
    });

    it("returns gift ideas for Groq provider", async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(VALID_GIFT_IDEAS) }, finish_reason: "stop" }],
        usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
      });

      const res = await POST(makeRequest({ profile: MOCK_PROFILE, provider: "groq", model: "llama-3.1-8b-instant" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.gift_ideas).toHaveLength(5);
    });
  });

  describe("400 Bad Request", () => {
    it("rejects invalid provider", async () => {
      const res = await POST(makeRequest({ profile: MOCK_PROFILE, provider: "anthropic" }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Provider invalide");
    });

    it("rejects invalid model name", async () => {
      const res = await POST(makeRequest({ profile: MOCK_PROFILE, model: "invalid model!@#" }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Model invalide");
    });
  });

  describe("503 Service Unavailable", () => {
    it("returns 503 when GEMINI_API_KEY is missing", async () => {
      delete process.env.GEMINI_API_KEY;

      const res = await POST(makeRequest({ profile: MOCK_PROFILE, provider: "google" }));
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toBe("GEMINI_API_KEY manquante");
    });

    it("returns 503 when GROQ_API_KEY is missing", async () => {
      delete process.env.GROQ_API_KEY;

      const res = await POST(makeRequest({ profile: MOCK_PROFILE, provider: "groq" }));
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toBe("GROQ_API_KEY manquante");
    });
  });

  describe("502 Bad Gateway — LLM errors", () => {
    it("returns 500 when Google LLM throws (empty response)", async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => "", candidates: [] },
      });

      const res = await POST(makeRequest({ profile: MOCK_PROFILE, provider: "google" }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Failed");
    });

    it("returns 500 when Groq LLM throws (empty content)", async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: "" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 50, completion_tokens: 0, total_tokens: 50 },
      });

      const res = await POST(makeRequest({ profile: MOCK_PROFILE, provider: "groq", model: "llama-3.1-8b-instant" }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Failed");
    });

    it("returns 502 when validation fails after retry (Google)", async () => {
      mockGenerateContent
        .mockResolvedValueOnce({
          response: { text: () => '{"gift_ideas": []}', candidates: [] },
        })
        .mockResolvedValueOnce({
          response: { text: () => '{"gift_ideas": []}', candidates: [] },
        });

      const res = await POST(makeRequest({ profile: MOCK_PROFILE, provider: "google" }));
      const body = await res.json();

      expect(res.status).toBe(502);
    });

    it("returns 502 when validation fails after retry (Groq)", async () => {
      mockGroqCreate
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"gift_ideas": []}' }, finish_reason: "stop" }],
          usage: { prompt_tokens: 50, completion_tokens: 10, total_tokens: 60 },
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"gift_ideas": []}' }, finish_reason: "stop" }],
          usage: { prompt_tokens: 50, completion_tokens: 10, total_tokens: 60 },
        });

      const res = await POST(makeRequest({ profile: MOCK_PROFILE, provider: "groq", model: "llama-3.1-8b-instant" }));
      const body = await res.json();

      expect(res.status).toBe(502);
    });
  });

  describe("retry on first validation failure", () => {
    it("succeeds on second attempt when first returns invalid format (Google)", async () => {
      mockGenerateContent
        .mockResolvedValueOnce({
          response: { text: () => '{"gift_ideas": []}', candidates: [] },
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify(VALID_GIFT_IDEAS),
            candidates: [{ finishReason: "STOP" }],
          },
        });

      const res = await POST(makeRequest({ profile: MOCK_PROFILE, provider: "google" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.gift_ideas).toHaveLength(5);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it("succeeds on second attempt when first returns invalid format (Groq)", async () => {
      mockGroqCreate
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"gift_ideas": []}' }, finish_reason: "stop" }],
          usage: { prompt_tokens: 50, completion_tokens: 10, total_tokens: 60 },
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(VALID_GIFT_IDEAS) }, finish_reason: "stop" }],
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
        });

      const res = await POST(makeRequest({ profile: MOCK_PROFILE, provider: "groq", model: "llama-3.1-8b-instant" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.gift_ideas).toHaveLength(5);
      expect(mockGroqCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe("Groq json_schema fallback", () => {
    it("retries with json_object when json_schema is rejected", async () => {
      mockGroqCreate
        .mockRejectedValueOnce(new Error("json_schema is not supported"))
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(VALID_GIFT_IDEAS) }, finish_reason: "stop" }],
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
        });

      const res = await POST(makeRequest({ profile: MOCK_PROFILE, provider: "groq", model: "llama-3.1-8b-instant" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.gift_ideas).toHaveLength(5);
      expect(mockGroqCreate).toHaveBeenCalledTimes(2);
    });
  });
});
