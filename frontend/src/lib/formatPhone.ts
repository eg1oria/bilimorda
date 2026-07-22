export function formatPhone(value: string) {
  let digits = value.replace(/\D/g, '');

  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith('7') && digits.length > 10) {
    return `+${digits.slice(0, 15)}`;
  }
  if (!digits.startsWith('7') && digits.length > 0) digits = `7${digits}`;
  digits = digits.slice(0, 11);

  if (digits.length === 0) return '';

  const country = '+7';
  const area = digits.slice(1, 4);
  const first = digits.slice(4, 7);
  const second = digits.slice(7, 9);
  const third = digits.slice(9, 11);

  let result = country;
  if (area) result += ` (${area}`;
  if (area.length === 3) result += ')';
  if (first) result += ` ${first}`;
  if (second) result += `-${second}`;
  if (third) result += `-${third}`;

  return result;
}
