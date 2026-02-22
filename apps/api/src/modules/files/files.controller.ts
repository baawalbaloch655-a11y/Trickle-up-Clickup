import { Controller, Get, Post, Delete, Body, Param, Headers, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class GetUploadUrlDto {
    @ApiProperty() @IsString() fileName: string;
    @ApiProperty() @IsString() mimeType: string;
}

class ConfirmUploadDto {
    @ApiProperty() @IsString() key: string;
    @ApiProperty() @IsString() originalName: string;
    @ApiProperty() @IsNumber() size: number;
    @ApiProperty() @IsString() mimetype: string;
}

@ApiTags('Files')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
    constructor(private readonly service: FilesService) { }

    @Post('upload-url')
    @RequirePermissions('files:write')
    @ApiOperation({ summary: 'Get presigned upload URL' })
    getUploadUrl(
        @Headers('x-org-id') orgId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: GetUploadUrlDto,
    ) {
        return this.service.getUploadUrl(orgId, userId, dto.fileName, dto.mimeType);
    }

    @Post('confirm')
    @RequirePermissions('files:write')
    @ApiOperation({ summary: 'Confirm file upload and store metadata' })
    confirmUpload(
        @Headers('x-org-id') orgId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: ConfirmUploadDto,
    ) {
        return this.service.confirmUpload(orgId, userId, dto);
    }

    @Get()
    @RequirePermissions('files:read')
    @ApiOperation({ summary: 'List files in org' })
    findAll(@Headers('x-org-id') orgId: string) {
        return this.service.findAll(orgId);
    }

    @Delete(':fileId')
    @RequirePermissions('files:write')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete file' })
    remove(@Headers('x-org-id') orgId: string, @Param('fileId') fileId: string) {
        return this.service.remove(orgId, fileId);
    }
}
