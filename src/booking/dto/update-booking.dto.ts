import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UploadPaymentProofDto {
  @IsUrl()
  @IsNotEmpty()
  proofUrl: string;
}

export class CancelBookingDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
