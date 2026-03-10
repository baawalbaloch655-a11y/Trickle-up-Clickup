import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateDocumentDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsUUID()
    @IsOptional()
    spaceId?: string;

    @IsUUID()
    @IsOptional()
    folderId?: string;

    @IsUUID()
    @IsOptional()
    parentId?: string;
}

export class UpdateDocumentDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    content?: string;
}
