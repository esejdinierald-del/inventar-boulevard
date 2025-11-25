import { MappingData } from "@/types/mapping.types";

/**
 * Normalizo emrin e produktit për matching më të mirë
 * Heq paketimin, detaje shtesë, dhe standardizon formatin
 */
export const normalizeProductName = (name: string): string => {
  return name
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')  // Zëvendëso hapësira të shumta me një
    .replace(/\s*(E|I|TE)\s*\d+\s*(CP|GR|ML|KG|L|PCS|COPE|COPË)?\s*$/i, '')  // Heq paketimin në fund
    .replace(/\s*(NGA|ME|PA|PER|PRO)\s+.*$/i, '')  // Heq detaje shtesë
    .trim();
};

/**
 * Gjej mapping më të mirë për një produkt duke përdorur fuzzy matching
 * Provon: exact match -> normalized match -> partial match
 */
export const findBestMapping = (
  productName: string, 
  savedMapping: MappingData | null
) => {
  if (!savedMapping) return null;
  
  const normalized = normalizeProductName(productName);
  
  // Provo match të saktë së pari
  if (savedMapping[productName]) {
    return savedMapping[productName];
  }
  
  // Provo match me emrin e normalizuar
  for (const [key, value] of Object.entries(savedMapping)) {
    if (normalizeProductName(key) === normalized) {
      return value;
    }
  }
  
  // Provo partial match
  for (const [key, value] of Object.entries(savedMapping)) {
    const normalizedKey = normalizeProductName(key);
    if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
      return value;
    }
  }
  
  return null;
};
