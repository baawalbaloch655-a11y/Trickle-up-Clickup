import {
    Controller,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/auth.decorators';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new account' })
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.register(dto);
        this.setRefreshCookie(res, result.refreshToken);
        const { refreshToken, ...response } = result;
        return response;
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(dto);
        this.setRefreshCookie(res, result.refreshToken);
        const { refreshToken, ...response } = result;
        return response;
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token using refresh token' })
    async refreshTokens(@Body() dto: RefreshTokenDto, @Res({ passthrough: true }) res: Response) {
        const tokens = await this.authService.refreshTokens(dto.refreshToken);
        this.setRefreshCookie(res, tokens.refreshToken);
        const { refreshToken, ...response } = tokens;
        return response;
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Logout and revoke refresh tokens' })
    async logout(@CurrentUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
        res.clearCookie('refresh_token');
        return this.authService.logout(userId);
    }

    @Get('me')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get current authenticated user profile' })
    async getMe(@CurrentUser('id') userId: string) {
        return this.authService.getMe(userId);
    }

    private setRefreshCookie(res: Response, token: string) {
        res.cookie('refresh_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/v1/auth/refresh',
        });
    }
}
