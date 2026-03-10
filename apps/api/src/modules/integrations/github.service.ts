import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GithubService {
    private readonly logger = new Logger(GithubService.name);

    constructor(private prisma: PrismaService) { }

    async fetchRepositories(orgId: string) {
        // Find github integration
        const integration = await this.prisma.integration.findUnique({
            where: { orgId_provider: { orgId, provider: 'github' } }
        });

        if (!integration || !(integration.credentials as any)?.token) {
            this.logger.warn(`No valid GitHub integration found for org ${orgId}`);
            return [];
        }

        // SIMULATED: Return mock repositories
        this.logger.log(`[GITHUB SIMULATOR] Fetching repositories for org ${orgId}`);
        return [
            { id: 1, name: 'trickleup-core', fullName: 'trickleup/trickleup-core' },
            { id: 2, name: 'trickleup-web', fullName: 'trickleup/trickleup-web' },
        ];
    }
}
