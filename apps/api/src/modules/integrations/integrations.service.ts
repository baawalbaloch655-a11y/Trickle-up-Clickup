import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIntegrationDto, UpdateIntegrationDto } from './dto/integration.dto';

@Injectable()
export class IntegrationsService {
    constructor(private prisma: PrismaService) { }

    async create(orgId: string, data: CreateIntegrationDto) {
        return this.prisma.integration.upsert({
            where: {
                orgId_provider: {
                    orgId,
                    provider: data.provider,
                },
            },
            update: {
                credentials: data.credentials,
                config: data.config,
                externalId: data.externalId,
            },
            create: {
                orgId,
                ...data,
            },
        });
    }

    async getSlackAuthUrl(orgId: string) {
        // Return a mock auth URL that the frontend can simulate
        return { url: `/api/v1/integrations/slack/callback?code=mock_slack_code_123` };
    }

    async handleSlackCallback(orgId: string, code: string) {
        // Exchange code for token (simulated)
        const mockToken = 'xoxb-mock-slack-token-' + Date.now();
        await this.create(orgId, {
            provider: 'slack',
            credentials: { token: mockToken },
        });
        return { success: true, token: mockToken };
    }

    async getGithubAuthUrl(orgId: string) {
        return { url: `/api/v1/integrations/github/callback?code=mock_gh_code_123` };
    }

    async handleGithubCallback(orgId: string, code: string) {
        const mockToken = 'gho_mock_token_' + Date.now();
        await this.create(orgId, {
            provider: 'github',
            credentials: { token: mockToken },
        });
        return { success: true, token: mockToken };
    }

    async findAll(orgId: string) {
        return this.prisma.integration.findMany({
            where: { orgId }
        });
    }

    async findOne(orgId: string, id: string) {
        const integration = await this.prisma.integration.findFirst({
            where: { id, orgId },
        });

        if (!integration) throw new NotFoundException('Integration not found');
        return integration;
    }

    async update(orgId: string, id: string, data: UpdateIntegrationDto) {
        await this.findOne(orgId, id);
        return this.prisma.integration.update({
            where: { id },
            data,
        });
    }

    async remove(orgId: string, id: string) {
        await this.findOne(orgId, id);
        return this.prisma.integration.delete({
            where: { id },
        });
    }
}
