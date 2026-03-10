import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { RealtimeModule } from '../../realtime/realtime.module';
import { AutomationsModule } from '../automations/automations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IntegrationsModule } from '../integrations/integrations.module';

import { GlobalTasksController } from './global-tasks.controller';

@Module({
    imports: [RealtimeModule, AutomationsModule, NotificationsModule, IntegrationsModule],
    controllers: [TasksController, GlobalTasksController],
    providers: [TasksService],
    exports: [TasksService]
})
export class TasksModule { }
