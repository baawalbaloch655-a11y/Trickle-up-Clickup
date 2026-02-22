import {
    Controller, Get, Post, Body, Param, Headers, UseGuards
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, CreateTeamDto } from './dto/department.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/auth.decorators';

@ApiTags('Departments & Teams')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-org-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentsController {
    constructor(private readonly service: DepartmentsService) { }

    @Get()
    @RequirePermissions('users:read')
    @ApiOperation({ summary: 'List all departments and their teams' })
    findAll(@Headers('x-org-id') orgId: string) {
        return this.service.findAllDepartments(orgId);
    }

    @Post()
    @RequirePermissions('users:write')
    @ApiOperation({ summary: 'Create a new department' })
    create(@Headers('x-org-id') orgId: string, @Body() dto: CreateDepartmentDto) {
        return this.service.createDepartment(orgId, dto);
    }

    @Post(':departmentId/teams')
    @RequirePermissions('users:write')
    @ApiOperation({ summary: 'Create a new team inside a department' })
    createTeam(
        @Headers('x-org-id') orgId: string,
        @Param('departmentId') departmentId: string,
        @Body() dto: CreateTeamDto
    ) {
        return this.service.createTeam(orgId, departmentId, dto);
    }
}
