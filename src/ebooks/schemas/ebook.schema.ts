import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EbookDocument = HydratedDocument<Ebook>;

@Schema({ timestamps: true })
export class Ebook {
    @Prop({ required: true })
    title: string;

    @Prop({ required: false })
    description: string;

    @Prop({ required: false })
    coverUrl: string;

    @Prop({ required: true })
    pdfUrl: string;

    @Prop({ default: true })
    isVisible: boolean;
}

export const EbookSchema = SchemaFactory.createForClass(Ebook);
