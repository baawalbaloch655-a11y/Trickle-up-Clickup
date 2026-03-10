import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { SlackService } from './slack.service';
import { GithubService } from './github.service';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, SlackService, GithubService],
  exports: [IntegrationsService, SlackService, GithubService]
})
export class IntegrationsModule { }
