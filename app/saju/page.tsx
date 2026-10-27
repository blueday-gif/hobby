import {
  CATEGORY_ORDER,
  CATEGORY_TEMPLATES,
  DAY_MASTER_TEMPLATES,
  HOBBY_TEMPLATES,
} from "@/lib/saju/templates";
import Landing from "./_components/landing";

export default function SajuLandingPage() {
  const characters = Object.values(DAY_MASTER_TEMPLATES).map((stem) => ({
    nickname: stem.nickname,
    element: stem.element,
  }));
  const categories = CATEGORY_ORDER.map((category) => ({
    name: CATEGORY_TEMPLATES[category].nameKo,
    hobbies: HOBBY_TEMPLATES.filter((hobby) => hobby.category === category).map((hobby) => ({
      name: hobby.name,
      slug: hobby.slug,
      category: CATEGORY_TEMPLATES[category].nameKo,
      shortCopy: hobby.shortCopy,
      starterGuide: hobby.starterGuide,
    })),
  }));

  return <Landing characters={characters} categories={categories} />;
}
