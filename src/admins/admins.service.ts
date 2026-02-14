import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument } from './schemas/admin.schema';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminsService {
    constructor(@InjectModel(Admin.name) private adminModel: Model<AdminDocument>) { }

    async create(createAdminDto: CreateAdminDto): Promise<Admin> {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(createAdminDto.password, salt);

        const createdAdmin = new this.adminModel({
            ...createAdminDto,
            password: hashedPassword,
        });
        return createdAdmin.save();
    }

    async findOne(username: string): Promise<AdminDocument | null> {
        return this.adminModel.findOne({ username }).exec();
    }

    async findAll(): Promise<Admin[]> {
        return this.adminModel.find().select('-password').exec();
    }

    async remove(id: string): Promise<Admin | null> {
        return this.adminModel.findByIdAndDelete(id).exec();
    }

    async toggleSuspension(id: string): Promise<Admin | null> {
        const admin = await this.adminModel.findById(id);
        if (!admin) return null;
        return this.adminModel.findByIdAndUpdate(id, { isSuspended: !admin.isSuspended }, { new: true }).exec();
    }

    async updateProfile(id: string, updateData: { referralCode?: string, phoneNumber?: string }): Promise<Admin | null> {
        return this.adminModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password').exec();
    }
}
