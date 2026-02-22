import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateTaskCommentDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    content: string;
}

export class UpdateTaskCommentDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    content: string;
}
