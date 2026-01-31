import { DayType } from '@prisma/client';
import { IsEnum, IsInt, Min, Max } from 'class-validator';

export class CreateFieldPriceDto {
  @IsEnum(DayType)
  dayType: DayType;

  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number;

  @IsInt()
  @Min(1)
  @Max(24)
  endHour: number;

  @IsInt()
  @Min(0)
  price: number;
}
