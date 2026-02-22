import {
    Controller, Get, Patch, Delete, Body, Param, Headers, UseGuards
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { UpdateEmployeeDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Employees')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-org-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
    constructor(private readonly service: EmployeesService) { }

    @Get()
    @RequirePermissions('users:read')
    @ApiOperation({ summary: 'List all employees' })
    findAll(@Headers('x-org-id') orgId: string) {
        return this.service.findAll(orgId);
    }

    @Get(':memberId')
    @RequirePermissions('users:read')
    @ApiOperation({ summary: 'Get employee details' })
    findOne(@Headers('x-org-id') orgId: string, @Param('memberId') memberId: string) {
        return this.service.findOne(orgId, memberId);
    }

    @Patch(':memberId')
    @RequirePermissions('users:write')
    @ApiOperation({ summary: 'Update employee HR profile' })
    update(
        @Headers('x-org-id') orgId: string,
        @Param('memberId') memberId: string,
        @CurrentUser('id') actorId: string,
        @Body() dto: UpdateEmployeeDto
    ) {
        return this.service.update(orgId, memberId, actorId, dto);
    }

    @Delete(':memberId')
    @RequirePermissions('users:write')
    @ApiOperation({ summary: 'Deactivate employee' })
    remove(
        @Headers('x-org-id') orgId: string,
        @Param('memberId') memberId: string,
        @CurrentUser('id') actorId: string
    ) {
        return this.service.remove(orgId, memberId, actorId);
    }
}
