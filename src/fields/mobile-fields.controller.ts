import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { MobileFieldsService } from './mobile-fields.service';
import { GetMobileFieldsQueryDto } from './dto/get-mobile-fields.query.dto';

@Controller('mobile/fields')
export class MobileFieldsController {
  constructor(private readonly mobileFieldsService: MobileFieldsService) {}

  /**
   * Mobile endpoint for listing fields with availability & price for a specific slot.
   *
   * Default slot: 1 hour starting at next full hour.
   *
   * Examples:
   * - /api/v1/mobile/fields
   * - /api/v1/mobile/fields?date=2026-01-09&startHour=19&durationHours=1
   * - /api/v1/mobile/fields?startTime=2026-01-09T19:00:00%2B07:00&endTime=2026-01-09T20:00:00%2B07:00
   */
  @Get()
  list(@Query() query: GetMobileFieldsQueryDto) {
    return this.mobileFieldsService.listMobileFields(query);
  }

  @Get(':id')
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetMobileFieldsQueryDto,
  ) {
    return this.mobileFieldsService.getMobileFieldDetail(id, query);
  }
}
