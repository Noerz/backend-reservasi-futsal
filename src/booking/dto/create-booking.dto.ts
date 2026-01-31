import { IsNotEmpty, IsOptional, IsUrl, IsUUID, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  fieldId: string;

  @IsString()
  @IsNotEmpty()
  startTime: string; // ISO 8601 or time-only like "14.00" or "14:00"

  @IsString()
  @IsNotEmpty()
  orderDate: string; // date in format YYYY-MM-DD or other parseable date

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  durationHours: number; // durasi dalam jam

  @IsUrl()
  @IsOptional()
  proofUrl?: string; // URL bukti pembayaran (optional)
}
