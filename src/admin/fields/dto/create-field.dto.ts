import { FieldType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  Max,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
  ArrayMaxSize,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFieldPriceDto } from './create-field-price.dto';

export class CreateFieldDto {
  @IsUUID()
  venueId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEnum(FieldType)
  type: FieldType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  lengthMeter?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  widthMeter?: number;

  /** Array of image URLs for this field. First item will be primary. */
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  @IsOptional()
  imageUrls?: string[];

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateFieldPriceDto)
  @IsOptional()
  prices?: CreateFieldPriceDto[];
}
