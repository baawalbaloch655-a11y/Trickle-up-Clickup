import {
    Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto, InviteMemberDto, UpdateMemberRoleDto } from './dto/organization.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/auth.decorators';

@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
    constructor(private readonly service: OrganizationsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new organization' })
    create(@CurrentUser('id') userId: string, @Body() dto: CreateOrganizationDto) {
        return this.service.create(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List all organizations for current user' })
    findAll(@CurrentUser('id') userId: string) {
        return this.service.findAll(userId);
    }

    @Get(':orgId')
    @ApiOperation({ summary: 'Get organization details' })
    findOne(@Param('orgId') orgId: string) {
        return this.service.findOne(orgId);
    }

    @Patch(':orgId')
    @RequirePermissions('org:write')
    @ApiOperation({ summary: 'Update organization' })
    update(@Param('orgId') orgId: string, @Body() dto: UpdateOrganizationDto) {
        return this.service.update(orgId, dto);
    }

    @Get(':orgId/members')
    @RequirePermissions('members:read')
    @ApiOperation({ summary: 'List organization members' })
    getMembers(@Param('orgId') orgId: string) {
        return this.service.getMembers(orgId);
    }

    @Post(':orgId/members')
    @RequirePermissions('members:write')
    @ApiOperation({ summary: 'Invite a user to the organization' })
    inviteMember(@Param('orgId') orgId: string, @Body() dto: InviteMemberDto) {
        return this.service.inviteMember(orgId, dto);
    }

    @Patch(':orgId/members/:memberId/role')
    @RequirePermissions('members:write')
    @ApiOperation({ summary: 'Update member role' })
    updateMemberRole(
        @Param('orgId') orgId: string,
        @Param('memberId') memberId: string,
        @Body() dto: UpdateMemberRoleDto,
    ) {
        return this.service.updateMemberRole(orgId, memberId, dto);
    }

    @Delete(':orgId/members/:memberId')
    @RequirePermissions('members:write')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove member from organization' })
    removeMember(
        @Param('orgId') orgId: string,
        @Param('memberId') memberId: string,
        @CurrentUser('id') requesterId: string,
    ) {
        return this.service.removeMember(orgId, memberId, requesterId);
    }
}
