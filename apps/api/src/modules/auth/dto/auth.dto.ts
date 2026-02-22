import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'Jane Doe' })
    @IsString()
    @MinLength(2)
    @MaxLength(80)
    name: string;

    @ApiProperty({ example: 'jane@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SuperSecret123!', minLength: 8 })
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password: string;
}

export class LoginDto {
    @ApiProperty({ example: 'jane@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SuperSecret123!' })
    @IsString()
    @MinLength(1)
    password: string;
}

export class RefreshTokenDto {
    @ApiProperty()
    @IsString()
    refreshToken: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ example: 'jane@example.com' })
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty()
    @IsString()
    token: string;

    @ApiProperty({ minLength: 8 })
    @IsString()
    @MinLength(8)
    newPassword: string;
}
