import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { AdminRole } from '../schemas/admin.schema';

export class CreateAdminDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsEnum(AdminRole)
    role: AdminRole;
}
