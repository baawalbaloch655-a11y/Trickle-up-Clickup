import { IsEnum, IsString, IsUUID } from 'class-validator';
import { FavoriteType } from '@prisma/client';

export class ToggleFavoriteDto {
    @IsEnum(FavoriteType)
    entityType: FavoriteType;

    @IsString()
    entityId: string;
}
