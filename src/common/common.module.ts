import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { FileUploadService } from './file-upload.service';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [LoggerService, FileUploadService, EmailService],
  exports: [LoggerService, FileUploadService, EmailService],
})
export class CommonModule {}
