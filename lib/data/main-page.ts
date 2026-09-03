import { strapiGet } from "@/lib/strapi";

export interface HeroSection {
  heading: string;
  subheading: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string | null;
  secondaryCtaLink: string | null;
  backgroundImageUrl: string | null;
  isActive: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface MainPage {
  heroSection: HeroSection | null;
  faqItems: FaqItem[];
}

function resolveImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ""}${url}`;
}

export async function getMainPage(): Promise<MainPage | null> {
  try {
    const result = await strapiGet<{
      hero_section: {
        heading: string;
        subheading: string;
        primary_cta_text: string;
        primary_cta_link: string;
        secondary_cta_text: string | null;
        secondary_cta_link: string | null;
        background_image: { url: string } | null;
        is_active: boolean;
      } | null;
      faq_section: { question: string; answer: string }[] | null;
    }>("/api/main-page", {
      "populate": "hero_section.background_image,faq_section",
    });

    const data = result.data;
    return {
      heroSection: data.hero_section
        ? {
            heading: data.hero_section.heading,
            subheading: data.hero_section.subheading,
            primaryCtaText: data.hero_section.primary_cta_text,
            primaryCtaLink: data.hero_section.primary_cta_link,
            secondaryCtaText: data.hero_section.secondary_cta_text ?? null,
            secondaryCtaLink: data.hero_section.secondary_cta_link ?? null,
            backgroundImageUrl: resolveImageUrl(data.hero_section.background_image?.url),
            isActive: data.hero_section.is_active,
          }
        : null,
      faqItems: (data.faq_section ?? []).map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
    };
  } catch {
    return null;
  }
}
