import { Module } from '@nestjs/common';
import { TaskCommentsController } from './task-comments.controller';
import { TaskCommentsService } from './task-comments.service';
import { RealtimeModule } from '../../realtime/realtime.module';

@Module({
    imports: [RealtimeModule],
    controllers: [TaskCommentsController],
    providers: [TaskCommentsService],
    exports: [TaskCommentsService],
})
export class TaskCommentsModule { }
