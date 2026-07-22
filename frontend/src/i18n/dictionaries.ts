import 'server-only';

import type { Locale } from './config';
import kk from './dictionaries/kk.json';
import ru from './dictionaries/ru.json';

export type Dictionary = typeof ru;

const dictionaries: Record<Locale, Dictionary> = {
  ru,
  kk,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
