import type { FirstAidGuide } from "@emergix/shared-types";

const STORAGE_KEY = "emergix:first-aid-guides";

const seedGuides: FirstAidGuide[] = [
  {
    id: "fa-1",
    category: "Trauma",
    title: "Control External Bleeding",
    steps: [
      "Apply direct pressure with a clean cloth.",
      "Raise the injured area above heart level if possible.",
      "Do not remove soaked cloth; add another layer and continue pressure.",
    ],
    voiceAudioUrl: "",
  },
  {
    id: "fa-2",
    category: "Cardiac",
    title: "CPR Basics (Adults)",
    steps: [
      "Call emergency services immediately.",
      "Push hard and fast in the center of the chest.",
      "Aim for 100-120 compressions per minute until help arrives.",
    ],
    voiceAudioUrl: "",
  },
];

export function getFirstAidGuides(): FirstAidGuide[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedGuides));
      return seedGuides;
    }

    const parsed = JSON.parse(raw) as FirstAidGuide[];
    return Array.isArray(parsed) ? parsed : seedGuides;
  } catch {
    return seedGuides;
  }
}
