import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProspectsService } from './prospects.service';
import { ProspectsController } from './prospects.controller';
import { Prospect, ProspectSchema } from './schemas/prospect.schema';
import { EbooksModule } from '../ebooks/ebooks.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Prospect.name, schema: ProspectSchema }]),
        EbooksModule
    ],
    controllers: [ProspectsController],
    providers: [ProspectsService],
})
export class ProspectsModule { }
