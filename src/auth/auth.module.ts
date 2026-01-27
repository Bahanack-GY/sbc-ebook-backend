import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminsModule } from '../admins/admins.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [
        AdminsModule,
        JwtModule.register({
            global: true,
            secret: 'SECRET_KEY_CHANGE_ME', // TODO: Use Environment Variable
            signOptions: { expiresIn: '1d' },
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }
