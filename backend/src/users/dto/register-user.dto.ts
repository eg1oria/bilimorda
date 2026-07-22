import { Transform } from 'class-transformer';
import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';

function cleanText({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
}

function normalizePhone({ value }: { value: unknown }) {
  if (typeof value !== 'string') return value;

  let digits = value.replace(/\D/g, '');
  if (digits.length === 10) digits = `7${digits}`;
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;

  return digits.length === 11 ? `+${digits}` : value;
}

export class RegisterUserDto {
  @Transform(cleanText)
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  fullName: string;

  @Transform(cleanText)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  school: string;

  @IsIn(['10', '11'])
  grade: '10' | '11';

  @Transform(normalizePhone)
  @IsString()
  @Matches(/^\+7\d{10}$/)
  phone: string;
}
