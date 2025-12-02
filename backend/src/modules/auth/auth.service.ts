import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayload, JwtResponse } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(registerDto: RegisterDto): Promise<User> {
        // Verificar si el usuario ya existe
        const existingUser = await this.usersRepository.findOne({
            where: { email: registerDto.email },
        });

        if (existingUser) {
            throw new ConflictException('El email ya está registrado');
        }

        // Crear nuevo usuario
        const user = this.usersRepository.create(registerDto);
        user.rol = 'admin'; // Rol por defecto

        return await this.usersRepository.save(user);
    }

    async login(loginDto: LoginDto): Promise<JwtResponse> {
        const { email, password } = loginDto;

        // Buscar usuario
        const user = await this.usersRepository.findOne({
            where: { email, isActive: true },
        });

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Validar contraseña
        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Generar JWT
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            rol: user.rol,
            nombre: user.nombre,
        };

        const access_token = this.jwtService.sign(payload);

        return {
            access_token,
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                rol: user.rol,
                avatarUrl: user.avatarUrl,
            },
        };
    }

    async getProfile(userId: string): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id: userId, isActive: true },
            select: ['id', 'nombre', 'email', 'rol', 'avatarUrl', 'createdAt'],
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return user;
    }

    async updateProfile(userId: string, updateDto: UpdateUserDto): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Si se actualiza el email, verificar que no exista
        if (updateDto.email && updateDto.email !== user.email) {
            const existingUser = await this.usersRepository.findOne({
                where: { email: updateDto.email },
            });

            if (existingUser) {
                throw new ConflictException('El email ya está registrado');
            }
        }

        // Actualizar usuario
        Object.assign(user, updateDto);
        await this.usersRepository.save(user);

        // Retornar usuario actualizado
        return this.getProfile(userId);
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Validar contraseña actual
        const isValidPassword = await user.validatePassword(currentPassword);
        if (!isValidPassword) {
            throw new BadRequestException('Contraseña actual incorrecta');
        }

        // Actualizar contraseña
        user.password = newPassword;
        await this.usersRepository.save(user);
    }

    async seedAdminUser(): Promise<void> {
        const adminExists = await this.usersRepository.findOne({
            where: { email: 'admin@onboarding.com' },
        });

        if (!adminExists) {
            const adminUser = this.usersRepository.create({
                nombre: 'Administrador',
                email: 'admin@onboarding.com',
                password: 'Admin123', // Se encriptará automáticamente
                rol: 'superadmin',
                avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsA2XA2Lx6CuvMGrtQ1NoKjI8v0T_b-Des-w8pzlfvwqma0xVWQRJ_ybtfCfLBOzoCSbL6DsrIlosyhT_SiaF-taAy9D5EGjFw23WVN19-nq-xu1t3oOhzfsAOUfucu3sr6MkGPjnIrTnq4YzSQ9Wk-PKL7gPBP-ERidVa8k7xX-Mj88gbFgSiAZ3aidiGjehu0F3KbEoltxmSpvPfpTZjgaWOQ3ET6fkgNasV14wAEJiCD8jEPZ5kz8w7HVeZfRPWEJ71DjgOzXk',
            });

            await this.usersRepository.save(adminUser);
            console.log('Usuario administrador creado');
        }
    }
}