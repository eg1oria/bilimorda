import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  MBTI_TARGETS,
  QUESTION_MODULES,
  RIASEC_TARGETS,
  TEAM_ROLE_TARGETS,
} from '../../questionnaire/questionnaire.constants';

function cleanRequiredText({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
}

function cleanOptionalText({ value }: { value: unknown }) {
  if (typeof value !== 'string') return value;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  return cleaned || null;
}

export class SaveQuestionDto {
  @Transform(cleanRequiredText)
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  textRu: string;

  @Transform(cleanOptionalText)
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  textKk?: string | null;

  @IsIn(QUESTION_MODULES)
  module: (typeof QUESTION_MODULES)[number];

  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder: number;

  @IsIn([...TEAM_ROLE_TARGETS, ...MBTI_TARGETS, ...RIASEC_TARGETS])
  scoreTarget: string;

  @IsBoolean()
  reverseScored: boolean;

  @IsBoolean()
  included: boolean;
}
