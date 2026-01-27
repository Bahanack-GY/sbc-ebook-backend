import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProspectDocument = HydratedDocument<Prospect>;

export enum SbcStatus {
    INSCRIT = 'INSCRIT',
    NON_INSCRIT = 'NON_INSCRIT',
    ABONNE = 'ABONNE'
}

@Schema({ timestamps: true })
export class Prospect {
    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ required: true })
    whatsapp: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    ebookId: string;

    @Prop({ type: String, required: false })
    adminId: string; // Optional for now, will be required later

    @Prop({ required: false, enum: SbcStatus, default: SbcStatus.NON_INSCRIT })
    sbcStatus: SbcStatus;

    @Prop({ required: false })
    lastVerifiedAt: Date;

    @Prop({ required: false, default: false })
    membershipFound: boolean;
}

export const ProspectSchema = SchemaFactory.createForClass(Prospect);
