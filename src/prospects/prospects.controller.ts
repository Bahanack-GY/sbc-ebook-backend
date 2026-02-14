import { Controller, Get, Post, Body, Query, Put, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProspectsService } from './prospects.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { SbcStatus } from './schemas/prospect.schema';

@Controller('prospects')
export class ProspectsController {
    constructor(private readonly prospectsService: ProspectsService) { }

    @Post()
    create(@Body() createProspectDto: CreateProspectDto) {
        return this.prospectsService.create(createProspectDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    findAll(
        @Request() req,
        @Query('ebookId') ebookId?: string,
        @Query('date') date?: string,
        @Query('sbcStatus') sbcStatus?: string
    ) {
        const adminId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.userId;
        return this.prospectsService.findAll({ ebookId, date, sbcStatus, adminId });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('stats')
    getStats(@Request() req) {
        const adminId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.userId;
        return this.prospectsService.getStats(adminId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: SbcStatus) {
        return this.prospectsService.updateStatus(id, status);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('verify/:id')
    verifyProspect(@Param('id') id: string) {
        return this.prospectsService.verifyProspectMembership(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('verify-batch')
    verifyBatch(@Query('batchSize') batchSize?: string) {
        const size = batchSize ? parseInt(batchSize, 10) : 10;
        return this.prospectsService.batchVerifyMemberships(Math.min(size, 10)); // Cap at 10 to respect rate limits
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('verification-stats')
    getVerificationStats(@Request() req) {
        const adminId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.userId;
        return this.prospectsService.getVerificationStats(adminId);
    }
}
