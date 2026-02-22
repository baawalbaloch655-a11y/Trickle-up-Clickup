import { Controller, Get, Post, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/conversation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Conversations')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-org-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
    constructor(private readonly service: ConversationsService) { }

    @Post()
    @ApiOperation({ summary: 'Create or find a conversation' })
    create(
        @Headers('x-org-id') orgId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: CreateConversationDto,
    ) {
        return this.service.create(orgId, userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List user conversations' })
    findAll(@Headers('x-org-id') orgId: string, @CurrentUser('id') userId: string) {
        return this.service.findAll(orgId, userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get conversation details' })
    findOne(
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.service.findOne(orgId, id, userId);
    }
}
