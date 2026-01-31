import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsBoolean()
  @IsNotEmpty()
  approved: boolean;

  @IsString()
  @IsOptional()
  note?: string;
}
