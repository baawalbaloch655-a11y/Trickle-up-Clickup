import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FilesModule } from './modules/files/files.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { FoldersModule } from './modules/folders/folders.module';
import { ListsModule } from './modules/lists/lists.module';
import { CustomFieldsModule } from './modules/custom-fields/custom-fields.module';
import { TimeEntriesModule } from './modules/time-entries/time-entries.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { TaskCommentsModule } from './modules/task-comments/task-comments.module';

// HR & Employee Management
import { EmployeesModule } from './modules/employees/employees.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
    imports: [
        // Config (loads .env)
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['../../.env', '.env'],
        }),

        // Rate limiting
        ThrottlerModule.forRoot([
            { name: 'short', ttl: 1000, limit: 20 },
            { name: 'medium', ttl: 60000, limit: 300 },
            { name: 'long', ttl: 3600000, limit: 5000 },
        ]),

        // Core
        PrismaModule,

        // Feature modules
        AuthModule,
        UsersModule,
        OrganizationsModule,
        TasksModule,
        NotificationsModule,
        FilesModule,
        AnalyticsModule,

        // HR & Employee Management
        EmployeesModule,
        DepartmentsModule,
        AuditLogsModule,

        // Realtime
        RealtimeModule,

        // Hierarchy
        SpacesModule,
        FoldersModule,
        ListsModule,

        // Enterprise Customization
        CustomFieldsModule,
        TimeEntriesModule,
        AutomationsModule,

        // Collaboration
        TaskCommentsModule,
        FavoritesModule,
        ChannelsModule,
        ConversationsModule,
        MessagesModule,
    ],
})
export class AppModule { }
