import type { Locale } from '@/i18n/config';
import { resultCatalogKk } from './result-catalog.kk';
import { resultCatalogRu } from './result-catalog.ru';
import type { ResultCatalog, ResultCatalogs } from './result-catalog.types';

const resultCatalogs = {
  ru: resultCatalogRu,
  kk: resultCatalogKk,
} satisfies ResultCatalogs;

export function getResultCatalog(locale: Locale): ResultCatalog {
  return resultCatalogs[locale];
}

export * from './result-catalog.types';
