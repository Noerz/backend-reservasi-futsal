import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetMobileFieldsQueryDto {
  /** ISO datetime. Example: 2026-01-09T19:00:00+07:00 */
  @IsOptional()
  @IsISO8601({ strict: true })
  startTime?: string;

  /** ISO datetime. Example: 2026-01-09T20:00:00+07:00 */
  @IsOptional()
  @IsISO8601({ strict: true })
  endTime?: string;

  /** Convenience alternative: if startTime/endTime not provided */
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  @Max(23)
  startHour?: number;

  /** Convenience alternative: if startTime/endTime not provided */
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(24)
  durationHours?: number;

  /** Optional: YYYY-MM-DD (local timezone). If omitted uses today. */
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  venueId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === 'true' || value === true))
  @IsBoolean()
  onlyAvailable?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
