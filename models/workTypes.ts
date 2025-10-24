export const WorkTypeValues = ['digital', 'physical'] as const;

export type WorkType = (typeof WorkTypeValues)[number];

export const WorkFormatValues = [
  'Visual digital static',
  'Visual digital animated',
  'Visual digital interactive',
  'Visual audio-reactive',
  'Audio-visual',
  'Visual print poster',
  'Visual print book',
] as const;

export type WorkFormat = (typeof WorkFormatValues)[number];
