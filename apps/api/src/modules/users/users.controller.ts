import { Controller, Get, Patch, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class UpdateProfileDto {
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() avatarUrl?: string;
}

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly service: UsersService) { }

    @Patch('profile')
    @ApiOperation({ summary: 'Update current user profile' })
    updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
        return this.service.updateProfile(userId, dto);
    }

    @Get('search')
    @ApiOperation({ summary: 'Search members in org' })
    search(@Headers('x-org-id') orgId: string, @Query('q') q: string) {
        return this.service.searchOrgMembers(orgId, q || '');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    findOne(@Param('id') id: string) {
        return this.service.findById(id);
    }
}
