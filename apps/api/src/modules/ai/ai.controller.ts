import { Controller, Get, Post, Body, Param, UseGuards, Headers } from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateAiOperationDto } from './dto/ai-operation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post()
    create(@Headers('x-org-id') orgId: string, @CurrentUser('id') userId: string, @Body() createAiOperationDto: CreateAiOperationDto) {
        return this.aiService.create(orgId, userId, createAiOperationDto);
    }

    @Get()
    findAll(@Headers('x-org-id') orgId: string) {
        return this.aiService.findAll(orgId);
    }

    @Get(':id')
    findOne(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.aiService.findOne(orgId, id);
    }
}
