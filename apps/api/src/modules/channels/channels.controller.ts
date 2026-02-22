import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Channels')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-org-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
    constructor(private readonly service: ChannelsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new channel' })
    create(
        @Headers('x-org-id') orgId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: CreateChannelDto,
    ) {
        return this.service.create(orgId, userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List available channels' })
    findAll(@Headers('x-org-id') orgId: string, @CurrentUser('id') userId: string) {
        return this.service.findAll(orgId, userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get channel details' })
    findOne(
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.service.findOne(orgId, id, userId);
    }

    @Post(':id/join')
    @ApiOperation({ summary: 'Join a public channel' })
    join(
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.service.join(orgId, id, userId);
    }

    @Delete(':id/leave')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Leave a channel' })
    leave(
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.service.leave(orgId, id, userId);
    }
}
