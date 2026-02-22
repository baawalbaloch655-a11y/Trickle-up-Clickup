import {
    Controller, Get, Patch, Delete, Param, Headers, UseGuards, HttpCode, HttpStatus, Query
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-org-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly service: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get notifications for current user' })
    findAll(
        @CurrentUser('id') userId: string,
        @Headers('x-org-id') orgId: string,
        @Query('category') category?: string,
        @Query('isCleared') isCleared?: string,
    ) {
        return this.service.findAll(userId, orgId, {
            category,
            isCleared: isCleared === 'true',
        });
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    getUnreadCount(@CurrentUser('id') userId: string, @Headers('x-org-id') orgId: string) {
        return this.service.getUnreadCount(userId, orgId);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.service.markRead(userId, id);
    }

    @Patch('mark-all-read')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    markAllRead(@CurrentUser('id') userId: string, @Headers('x-org-id') orgId: string) {
        return this.service.markAllRead(userId, orgId);
    }

    @Patch(':id/clear')
    @ApiOperation({ summary: 'Clear (archive) notification' })
    clear(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.service.clearNotification(userId, id);
    }

    @Patch('clear-all')
    @ApiOperation({ summary: 'Clear all notifications' })
    clearAll(@CurrentUser('id') userId: string, @Headers('x-org-id') orgId: string) {
        return this.service.clearAll(userId, orgId);
    }

    @Patch(':id/category')
    @ApiOperation({ summary: 'Update notification category' })
    updateCategory(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Query('category') category: string,
    ) {
        return this.service.updateCategory(userId, id, category);
    }
}
