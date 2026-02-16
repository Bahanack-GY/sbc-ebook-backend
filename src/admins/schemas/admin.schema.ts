import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminDocument = HydratedDocument<Admin>;

export enum AdminRole {
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN'
}

@Schema({ timestamps: true })
export class Admin {
    @Prop({ required: true, unique: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, enum: AdminRole, default: AdminRole.ADMIN })
    role: AdminRole;

    @Prop({ default: false })
    isSuspended: boolean;

    @Prop({ required: false })
    referralCode?: string;

    @Prop({ required: false })
    phoneNumber?: string;

    @Prop({ required: false })
    salesPageLink?: string;

    @Prop({ required: false })
    whatsappGroupLink?: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
