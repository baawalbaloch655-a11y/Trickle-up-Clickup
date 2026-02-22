import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateConversationDto {
    @IsArray()
    @IsUUID('4', { each: true })
    userIds: string[];

    @IsBoolean()
    @IsOptional()
    isGroup?: boolean;

    @IsString()
    @IsOptional()
    name?: string;
}
