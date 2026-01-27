import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ebook, EbookSchema } from './schemas/ebook.schema';
import { EbooksController } from './ebooks.controller';
import { EbooksService } from './ebooks.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Ebook.name, schema: EbookSchema }]),
        AuthModule
    ],
    controllers: [EbooksController],
    providers: [EbooksService],
    exports: [EbooksService]
})
export class EbooksModule { }
