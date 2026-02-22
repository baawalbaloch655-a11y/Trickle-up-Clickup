import { Controller, Get, Post, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-org-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
    constructor(private readonly service: MessagesService) { }

    @Post()
    @ApiOperation({ summary: 'Send a message' })
    create(
        @Headers('x-org-id') orgId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: CreateMessageDto,
    ) {
        return this.service.create(userId, orgId, dto);
    }

    @Get('channel/:channelId')
    @ApiOperation({ summary: 'Get messages for a channel' })
    findAllForChannel(
        @Headers('x-org-id') orgId: string,
        @Param('channelId') channelId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.service.findAllForChannel(orgId, channelId, userId);
    }

    @Get('conversation/:conversationId')
    @ApiOperation({ summary: 'Get messages for a conversation' })
    findAllForConversation(
        @Headers('x-org-id') orgId: string,
        @Param('conversationId') conversationId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.service.findAllForConversation(orgId, conversationId, userId);
    }
}
