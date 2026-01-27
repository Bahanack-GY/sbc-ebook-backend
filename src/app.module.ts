import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProspectsModule } from './prospects/prospects.module';
import { AdminsModule } from './admins/admins.module';
import { AuthModule } from './auth/auth.module';
import { EbooksModule } from './ebooks/ebooks.module';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot('mongodb://localhost:27017/ebook-sbc'),
    ProspectsModule,
    AdminsModule,
    AuthModule,
    EbooksModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
