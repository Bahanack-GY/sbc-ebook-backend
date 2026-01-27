import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AdminsService } from './src/admins/admins.service';
import { AdminRole } from './src/admins/schemas/admin.schema';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const adminsService = app.get(AdminsService);

    const superAdminUsername = 'superadmin';
    const superAdminPassword = 'superpassword123'; // Weak for demo

    try {
        const existing = await adminsService.findOne(superAdminUsername);
        if (existing) {
            console.log('Super Admin already exists.');
        } else {
            await adminsService.create({
                username: superAdminUsername,
                password: superAdminPassword,
                role: AdminRole.SUPER_ADMIN
            });
            console.log(`Super Admin created. Username: ${superAdminUsername}, Password: ${superAdminPassword}`);
        }
    } catch (e) {
        console.error('Seeding failed', e);
    } finally {
        await app.close();
    }
}
bootstrap();
