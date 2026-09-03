import { vi, describe, it, expect, beforeEach } from "vitest";
vi.mock("@/lib/strapi");
import { strapiGet } from "@/lib/strapi";
import { getMainPage } from "./main-page";

const mockGet = vi.mocked(strapiGet);

const strapiData = {
  hero_section: {
    heading: "Where faith meets fellowship",
    subheading: "Join us.",
    primary_cta_text: "Register",
    primary_cta_link: "/conferences",
    secondary_cta_text: "Learn More",
    secondary_cta_link: "/about",
    background_image: { url: "/uploads/hero.jpg" },
    is_active: true,
  },
  faq_section: [{ question: "Who can attend?", answer: "Everyone." }],
};

beforeEach(() => {
  vi.resetAllMocks();
  process.env.NEXT_PUBLIC_STRAPI_URL = "https://cms.test";
});

describe("getMainPage mapping", () => {
  it("maps primaryCtaText and isActive", async () => {
    mockGet.mockResolvedValue({ data: strapiData, meta: {} });
    const page = await getMainPage();
    expect(page?.heroSection?.primaryCtaText).toBe("Register");
    expect(page?.heroSection?.isActive).toBe(true);
  });

  it("resolves relative backgroundImageUrl with STRAPI_URL", async () => {
    mockGet.mockResolvedValue({ data: strapiData, meta: {} });
    const page = await getMainPage();
    expect(page?.heroSection?.backgroundImageUrl).toBe("https://cms.test/uploads/hero.jpg");
  });

  it("heroSection is null when hero_section is null", async () => {
    mockGet.mockResolvedValue({
      data: { ...strapiData, hero_section: null },
      meta: {},
    });
    const page = await getMainPage();
    expect(page?.heroSection).toBeNull();
  });

  it("faqItems is [] when faq_section is null", async () => {
    mockGet.mockResolvedValue({
      data: { ...strapiData, faq_section: null },
      meta: {},
    });
    const page = await getMainPage();
    expect(page?.faqItems).toEqual([]);
  });

  it("faqItems[0].question is mapped correctly", async () => {
    mockGet.mockResolvedValue({ data: strapiData, meta: {} });
    const page = await getMainPage();
    expect(page?.faqItems[0].question).toBe("Who can attend?");
  });

  it("returns null when strapiGet throws", async () => {
    mockGet.mockRejectedValue(new Error("network error"));
    const result = await getMainPage();
    expect(result).toBeNull();
  });
});
