import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminsService } from '../admins/admins.service';

@Injectable()
export class AuthService {
    constructor(
        private adminsService: AdminsService,
        private jwtService: JwtService
    ) { }

    async signIn(username: string, pass: string): Promise<{ access_token: string, adminId: string, role: string }> {
        const admin = await this.adminsService.findOne(username);
        if (!admin) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(pass, admin.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (admin.isSuspended) {
            throw new UnauthorizedException('Account suspended');
        }

        const payload = { sub: admin._id, username: admin.username, role: admin.role };
        return {
            access_token: await this.jwtService.signAsync(payload),
            adminId: admin._id.toString(),
            role: admin.role
        };
    }
}
