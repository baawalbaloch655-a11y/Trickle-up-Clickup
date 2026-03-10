import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SlackService {
    private readonly logger = new Logger(SlackService.name);

    constructor(private prisma: PrismaService) { }

    async sendMessage(orgId: string, message: string) {
        // Find slack integration for this org
        const integration = await this.prisma.integration.findUnique({
            where: { orgId_provider: { orgId, provider: 'slack' } }
        });

        if (!integration) {
            this.logger.warn(`No Slack integration found for org ${orgId}`);
            return false;
        }

        const token = (integration.credentials as any)?.token;
        if (!token) {
            this.logger.error(`Slack integration missing token for org ${orgId}`);
            return false;
        }

        // SIMULATED: In a real environment, we'd use axios or @slack/web-api
        // await axios.post('https://slack.com/api/chat.postMessage', { text: message, channel: 'general' }, { headers: { Authorization: \`Bearer \${token}\` } });

        this.logger.log(`[SLACK SIMULATOR] Sent message resolving to org ${orgId}: ${message}`);
        return true;
    }
}
