import { PartialType } from '@nestjs/mapped-types';
import { CreateFieldPriceDto } from './create-field-price.dto';

export class UpdateFieldPriceDto extends PartialType(CreateFieldPriceDto) {}
