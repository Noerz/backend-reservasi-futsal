import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './admin/roles/roles.module';
import { AdminAuthModule } from './admin/auth/admin-auth.module';
import { FieldsModule } from './admin/fields/fields.module';
import { AdminBookingsModule } from './admin/bookings/bookings.module';
import { BookingModule } from './booking/booking.module';
import { MobileFieldsModule } from './fields/mobile-fields.module';

@Module({
  imports: [
    CommonModule,
    PrismaModule,
    AuthModule,
    RolesModule,
    AdminAuthModule,
    FieldsModule,
    AdminBookingsModule,
    BookingModule,
    MobileFieldsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
