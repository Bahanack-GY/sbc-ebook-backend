import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ebook, EbookDocument } from './schemas/ebook.schema';

@Injectable()
export class EbooksService {
    constructor(@InjectModel(Ebook.name) private ebookModel: Model<EbookDocument>) { }

    async create(createEbookDto: any): Promise<Ebook> {
        const createdEbook = new this.ebookModel(createEbookDto);
        return createdEbook.save();
    }

    async findAll(): Promise<Ebook[]> {
        return this.ebookModel.find().exec();
    }

    async findVisible(): Promise<Ebook[]> {
        return this.ebookModel.find({ isVisible: true }).exec();
    }

    async findOne(id: string): Promise<Ebook | null> {
        return this.ebookModel.findById(id).exec();
    }

    async update(id: string, updateEbookDto: any): Promise<Ebook | null> {
        return this.ebookModel.findByIdAndUpdate(id, updateEbookDto, { new: true }).exec();
    }

    async remove(id: string): Promise<Ebook | null> {
        return this.ebookModel.findByIdAndDelete(id).exec();
    }
}
