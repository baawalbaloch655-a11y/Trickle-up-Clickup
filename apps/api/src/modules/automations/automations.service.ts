import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAutomationRuleDto, UpdateAutomationRuleDto } from './dto/automation.dto';

@Injectable()
export class AutomationsService {
    private readonly logger = new Logger(AutomationsService.name);

    constructor(private prisma: PrismaService) { }

    async create(orgId: string, dto: CreateAutomationRuleDto) {
        return this.prisma.automationRule.create({
            data: {
                orgId,
                name: dto.name,
                listId: dto.listId,
                trigger: dto.trigger,
                conditions: dto.conditions,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
                actions: {
                    create: dto.actions.map(action => ({
                        type: action.type,
                        payload: action.payload,
                    }))
                }
            },
            include: { actions: true }
        });
    }

    async findAll(orgId: string, listId?: string) {
        return this.prisma.automationRule.findMany({
            where: {
                orgId,
                listId: listId ? listId : undefined
            },
            include: { actions: true }
        });
    }

    async findOne(orgId: string, id: string) {
        const rule = await this.prisma.automationRule.findUnique({
            where: { id },
            include: { actions: true }
        });

        if (!rule || rule.orgId !== orgId) throw new NotFoundException('Automation rule not found');
        return rule;
    }

    async update(orgId: string, id: string, dto: UpdateAutomationRuleDto) {
        await this.findOne(orgId, id); // Verify access

        // Note: For simplicity, replacing all actions if provided.
        // In a real prod scenario we'd do smart upserts.

        return this.prisma.automationRule.update({
            where: { id },
            data: {
                name: dto.name,
                listId: dto.listId,
                trigger: dto.trigger,
                conditions: dto.conditions,
                isActive: dto.isActive,
                ...(dto.actions && {
                    actions: {
                        deleteMany: {}, // Clear old actions
                        create: dto.actions.map(action => ({
                            type: action.type,
                            payload: action.payload,
                        }))
                    }
                })
            },
            include: { actions: true }
        });
    }

    async remove(orgId: string, id: string) {
        await this.findOne(orgId, id);
        return this.prisma.automationRule.delete({ where: { id } });
    }

    // --- Core Automation Runner (Simulated) ---

    async evaluateTaskEvent(orgId: string, eventType: string, task: any, previousState: any) {
        this.logger.debug(`Evaluating task event ${eventType} for task ${task.id}`);

        // 1. Find active rules for this Org and Project
        const rules = await this.prisma.automationRule.findMany({
            where: {
                orgId,
                isActive: true,
                OR: [
                    { listId: task.listId },
                    { listId: null } // Workspace-level rules
                ]
            },
            include: { actions: true }
        });

        // 2. Filter matching triggers
        for (const rule of rules) {
            const trigger = rule.trigger as any;
            if (trigger.type === eventType) {
                // E.g. trigger.type = "STATUS_CHANGE", trigger.to = "DONE"
                if (trigger.to && task.status !== trigger.to) continue;
                if (trigger.from && previousState?.status !== trigger.from) continue;

                // 3. Evaluate Conditions (Simplified Check)
                let conditionPassed = true;
                if (rule.conditions) {
                    const conditions = rule.conditions as any;
                    if (conditions.priority && task.priority !== conditions.priority) conditionPassed = false;
                }

                if (conditionPassed) {
                    await this.executeActions(rule.actions, task);
                }
            }
        }
    }

    private async executeActions(actions: any[], context: any) {
        for (const action of actions) {
            this.logger.log(`[AUTOMATION] Executing Action: ${action.type} with Payload: ${JSON.stringify(action.payload)} for Task: ${context.id}`);

            // Example simulated action handlers:
            if (action.type === 'ASSIGN_USER') {
                // Call TasksService or execute raw update
                this.logger.debug(`-> Auto-assigning user ${action.payload.userId}`);
            } else if (action.type === 'SEND_EMAIL') {
                this.logger.debug(`-> Sending email to ${action.payload.to}`);
            } else if (action.type === 'WEBHOOK') {
                this.logger.debug(`-> Firing webhook to ${action.payload.url}`);
            }
        }
    }
}
