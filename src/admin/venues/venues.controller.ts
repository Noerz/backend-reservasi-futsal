import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { VenuesService } from './venues.service';
import { CreateVenueDto, UpdateVenueDto } from './dto';
import { AdminJwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';

@Controller('admin/venues')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('Super Admin', 'Administrator')
  create(@Body() createVenueDto: CreateVenueDto) {
    return this.venuesService.create(createVenueDto);
  }

  @Get()
  @Roles('Super Admin', 'Administrator', 'Admin')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.venuesService.findAll(page, limit, search);
  }

  @Get(':id')
  @Roles('Administrator', 'Admin')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.venuesService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrator')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVenueDto: UpdateVenueDto,
  ) {
    return this.venuesService.update(id, updateVenueDto);
  }

  @Delete(':id')
  @Roles('Administrator')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.venuesService.remove(id);
  }
}
