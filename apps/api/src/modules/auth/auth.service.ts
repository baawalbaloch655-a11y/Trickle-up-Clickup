import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) { }

    // ──────────────────────────────────────────
    // Register
    // ──────────────────────────────────────────
    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existing) {
            throw new ConflictException('An account with this email already exists');
        }

        const passwordHash = await argon2.hash(dto.password);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                name: dto.name,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                status: true,
                isEmailVerified: true,
                createdAt: true,
            },
        });

        this.logger.log(`New user registered: ${user.email}`);
        const tokens = await this.generateTokens(user.id, user.email);
        return { user, ...tokens };
    }

    // ──────────────────────────────────────────
    // Login
    // ──────────────────────────────────────────
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase(), deletedAt: null },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.status === 'BANNED') {
            throw new UnauthorizedException('This account has been suspended');
        }

        const passwordValid = await argon2.verify(user.passwordHash, dto.password);
        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Log audit
        await this.prisma.auditLog.create({
            data: {
                orgId: 'system',
                userId: user.id,
                action: 'LOGIN',
                resource: 'auth',
            },
        }).catch(() => { }); // Don't fail login if audit fails

        const tokens = await this.generateTokens(user.id, user.email);
        const { passwordHash, twoFaSecret, ...safeUser } = user;

        this.logger.log(`User logged in: ${user.email}`);
        return { user: safeUser, ...tokens };
    }

    // ──────────────────────────────────────────
    // Refresh tokens
    // ──────────────────────────────────────────
    async refreshTokens(rawRefreshToken: string) {
        let payload: { sub: string; email: string };
        try {
            payload = await this.jwtService.verifyAsync(rawRefreshToken, {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const tokenHash = await argon2.hash(rawRefreshToken);
        // Find any non-revoked token for this user (simplified — in prod match hash)
        const storedToken = await this.prisma.refreshToken.findFirst({
            where: {
                userId: payload.sub,
                isRevoked: false,
                expiresAt: { gt: new Date() },
            },
        });

        if (!storedToken) {
            throw new UnauthorizedException('Refresh token not found or revoked');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub, deletedAt: null },
            select: { id: true, email: true, status: true },
        });

        if (!user || user.status === 'BANNED') {
            throw new UnauthorizedException('User not found or banned');
        }

        // Revoke old token, issue new pair
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { isRevoked: true },
        });

        return this.generateTokens(user.id, user.email);
    }

    // ──────────────────────────────────────────
    // Logout
    // ──────────────────────────────────────────
    async logout(userId: string) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        });
        return { message: 'Logged out successfully' };
    }

    // ──────────────────────────────────────────
    // Token generation
    // ──────────────────────────────────────────
    private async generateTokens(userId: string, email: string) {
        const payload = { sub: userId, email };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.config.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '24h'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
            }),
        ]);

        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: await argon2.hash(refreshToken),
                expiresAt,
            },
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: 86400, // 24 hours in seconds
        };
    }

    async getMe(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId, deletedAt: null },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                status: true,
                isEmailVerified: true,
                twoFaEnabled: true,
                createdAt: true,
                updatedAt: true,
                orgMembers: {
                    include: {
                        org: { select: { id: true, name: true, slug: true, logoUrl: true, plan: true } },
                        role: { select: { id: true, name: true, permissions: true } },
                    },
                },
            },
        });
    }
}
