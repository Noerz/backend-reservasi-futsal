import { IsEmail, IsNotEmpty, IsString, MinLength, IsUUID, IsOptional } from 'class-validator';

export class RegisterAdminDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @IsUUID()
  @IsOptional()
  venueId?: string;
}
