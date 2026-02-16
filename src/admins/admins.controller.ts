import { Body, Controller, Post, Get, UseGuards, Delete, Patch, Param, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Controller('admins')
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) { }

    // TODO: Protect this endpoint with SuperAdminGuard
    @Post()
    create(@Body() createAdminDto: CreateAdminDto) {
        return this.adminsService.create(createAdminDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    findAll() {
        return this.adminsService.findAll();
    }

    @UseGuards(AuthGuard('jwt'))
    // @Roles('SUPER_ADMIN') // TODO: Uncomment when RolesGuard is applied globally or locally
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.adminsService.remove(id);
    }

    @UseGuards(AuthGuard('jwt'))
    // @Roles('SUPER_ADMIN') 
    @Patch(':id/suspend')
    toggleSuspension(@Param('id') id: string) {
        return this.adminsService.toggleSuspension(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('profile')
    updateProfile(@Req() req, @Body() updateProfileDto: any) {
        // req.user is set by JwtStrategy
        return this.adminsService.updateProfile(req.user.userId, updateProfileDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    getProfile(@Req() req) {
        return this.adminsService.getProfile(req.user.userId);
    }

    @Get('public/:idOrCode')
    findPublic(@Param('idOrCode') idOrCode: string) {
        return this.adminsService.findPublic(idOrCode);
    }
}
