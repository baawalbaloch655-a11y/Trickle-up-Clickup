import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateOrganizationDto {
    @ApiProperty({ example: 'Acme Corp' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @ApiProperty({ example: 'acme-corp' })
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase letters, numbers, and hyphens only' })
    slug: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    logoUrl?: string;
}

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) { }

export class InviteMemberDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsString()
    email: string;

    @ApiProperty({ example: 'role-uuid' })
    @IsString()
    roleId: string;
}

export class UpdateMemberRoleDto {
    @ApiProperty({ example: 'role-uuid' })
    @IsString()
    roleId: string;
}
