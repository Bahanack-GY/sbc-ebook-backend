import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { EbooksService } from './ebooks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('ebooks')
export class EbooksController {
    constructor(private readonly ebooksService: EbooksService) { }

    // Public endpoint for fetching visible ebooks (for prospects UI later)
    @Get('public')
    async findAllVisible() {
        return this.ebooksService.findVisible();
    }

    @Get('public/:id')
    async findOnePublic(@Param('id') id: string) {
        // Ideally checking visibility inside service, but for now just findOne
        const ebook = await this.ebooksService.findOne(id);
        if (ebook && !ebook.isVisible) return null; // Logic check
        return ebook;
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    @Post()
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'file', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
    ], {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async create(@UploadedFiles() files: any, @Body() createEbookDto: any) {
        let pdfUrl = createEbookDto.pdfUrl;
        let coverUrl = createEbookDto.coverUrl;

        if (files?.file?.[0]) {
            const serverUrl = 'https://api.sniperbusinessebook.online/'; // Should be env var
            pdfUrl = `${serverUrl}/uploads/${files.file[0].filename}`;
        }

        // If a file is uploaded for cover, use it (overwriting any base64 sent). 
        // If not, keep the base64 sent in createEbookDto.coverUrl
        if (files?.cover?.[0]) {
            const serverUrl = 'https://api.sniperbusinessebook.online/'; // Should be env var
            coverUrl = `${serverUrl}/uploads/${files.cover[0].filename}`;
        }

        return this.ebooksService.create({
            ...createEbookDto,
            pdfUrl,
            coverUrl,
            isVisible: createEbookDto.isVisible === 'true' || createEbookDto.isVisible === true // multipart/form-data sends strings
        });
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN') // Allow Admins to see list if needed, or restrict to Super Admin
    @Get()
    async findAll(@Request() req: any) {
        return this.ebooksService.findAll();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.ebooksService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateEbookDto: any) {
        // Update logic for files would require similar interceptor if we wanted to allow file updates
        // For now, keeping it simple or assuming just text updates for start, or user deletes and recreates
        return this.ebooksService.update(id, updateEbookDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.ebooksService.remove(id);
    }
}
