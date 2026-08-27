export const BUSINESS_INDUSTRY_LABELS: Record<string, string> = {
  food: 'Food & Drink',
  groceries: 'Groceries',
  pharmacy: 'Pharmacy',
  services: 'Services',
  shop: 'Shop',
  healthcare: 'Healthcare',
  beauty: 'Beauty & Wellness',
  automotive: 'Automotive',
  real_estate: 'Real Estate',
  entertainment: 'Entertainment',
  education: 'Education',
  professional: 'Professional Services',
  home_garden: 'Home & Garden',
  fitness: 'Fitness',
  hospitality: 'Travel & Hospitality',
  other: 'Other',
};

export const BUSINESS_INDUSTRY_IDS = Object.keys(BUSINESS_INDUSTRY_LABELS);

export function industryLabel(id: string | null | undefined): string {
  if (!id) return 'Industry';
  return BUSINESS_INDUSTRY_LABELS[id] ?? id;
}
