import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UploadPaymentProofDto, CancelBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileUploadService } from '../common/file-upload.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('paymentProof', FileUploadService.multerConfigPaymentProof),
  )
  create(
    @CurrentUser('sub') customerId: string,
    @Body() dto: CreateBookingDto,
    @UploadedFile() paymentProof?: Express.Multer.File,
  ) {
    let proofUrl: string | undefined;
    if (paymentProof) {
      this.fileUploadService.validateImageFile(paymentProof);
      proofUrl = this.fileUploadService.generateFileUrl(
        paymentProof.filename,
        'payment-proof',
      );
    }

    // Parse startTime: accept ISO or time-only like "14.00" or "14:00"
    let start: Date;
    const raw = dto.startTime.trim();
    const timeOnlyMatch = raw.match(/^(\d{1,2})[:.](\d{2})$/);
    if (timeOnlyMatch) {
      const hh = parseInt(timeOnlyMatch[1], 10);
      const mm = parseInt(timeOnlyMatch[2], 10);
      if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
        throw new BadRequestException('Invalid time format for startTime');
      }

      // combine with orderDate
      const datePart = new Date(dto.orderDate);
      if (isNaN(datePart.getTime())) {
        throw new BadRequestException('orderDate must be a valid date (YYYY-MM-DD)');
      }

      start = new Date(datePart);
      start.setHours(hh, mm, 0, 0);
    } else {
      // try ISO parse
      const parsed = new Date(raw);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException('startTime must be ISO8601 or time-only like "14:00"');
      }
      start = parsed;
    }

    if (start < new Date()) {
      throw new BadRequestException('Tidak dapat booking di waktu yang sudah lewat');
    }

    // Hitung endTime berdasarkan durationHours
    const end = new Date(start);
    end.setHours(start.getHours() + (dto as any).durationHours);

    return this.bookingService.create({
      customerId,
      fieldId: dto.fieldId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      proofUrl,
    });
  }

  @Get('my-bookings')
  getMyBookings(
    @CurrentUser('sub') customerId: string,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.bookingService.getMyBookings(customerId, {
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') customerId: string,
  ) {
    return this.bookingService.findOne(id, customerId);
  }

  @Post(':id/upload-payment')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('paymentProof', FileUploadService.multerConfigPaymentProof),
  )
  uploadPaymentProof(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') customerId: string,
    @UploadedFile() paymentProof?: Express.Multer.File,
    @Body() dto?: UploadPaymentProofDto,
  ) {
    let proofUrl: string;
    
    if (paymentProof) {
      this.fileUploadService.validateImageFile(paymentProof);
      proofUrl = this.fileUploadService.generateFileUrl(
        paymentProof.filename,
        'payment-proof',
      );
    } else if (dto?.proofUrl) {
      proofUrl = dto.proofUrl;
    } else {
      throw new BadRequestException('Payment proof file atau proofUrl harus disediakan');
    }

    return this.bookingService.uploadPaymentProof(id, customerId, { proofUrl });
  }

  @Patch(':id/cancel')
  cancelBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') customerId: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancelBooking(id, customerId, dto);
  }
}
