import { Controller, Get, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { ToggleFavoriteDto } from './dto/favorite.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Favorites')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-org-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
    constructor(private readonly service: FavoritesService) { }

    @Post('toggle')
    @ApiOperation({ summary: 'Toggle favorite for an entity' })
    toggle(
        @Headers('x-org-id') orgId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: ToggleFavoriteDto,
    ) {
        return this.service.toggle(userId, orgId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all favorites for the current user' })
    findAll(
        @Headers('x-org-id') orgId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.service.findAll(userId, orgId);
    }
}
