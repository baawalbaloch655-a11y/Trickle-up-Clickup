import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding TrickleUp database with comprehensive test data for ALL models...');

    // 1. Create Users (with new credentials as requested)
    const adminPassword = await argon2.hash('Admin123!');
    const defaultPassword = await argon2.hash('Password123!');
    const users = await Promise.all([
        prisma.user.upsert({
            where: { email: 'admin@trickleup.io' },
            update: { passwordHash: adminPassword },
            create: { email: 'admin@trickleup.io', name: 'TrickleUp Admin', passwordHash: adminPassword, isEmailVerified: true, status: 'ACTIVE' },
        }),
        prisma.user.upsert({
            where: { email: 'sarah@trickleup.io' },
            update: { passwordHash: defaultPassword },
            create: { email: 'sarah@trickleup.io', name: 'Sarah Chen (PM)', passwordHash: defaultPassword, isEmailVerified: true, status: 'ACTIVE' },
        }),
        prisma.user.upsert({
            where: { email: 'marcus@trickleup.io' },
            update: { passwordHash: defaultPassword },
            create: { email: 'marcus@trickleup.io', name: 'Marcus Doe (Eng)', passwordHash: defaultPassword, isEmailVerified: true, status: 'ACTIVE' },
        }),
        prisma.user.upsert({
            where: { email: 'emma@trickleup.io' },
            update: { passwordHash: defaultPassword },
            create: { email: 'emma@trickleup.io', name: 'Emma Watson (UI/UX)', passwordHash: defaultPassword, isEmailVerified: true, status: 'ACTIVE' },
        }),
        // NEW CREDENTIALS ADDED
        prisma.user.upsert({
            where: { email: 'hydra@trickleup.io' },
            update: { passwordHash: adminPassword },
            create: { email: 'hydra@trickleup.io', name: 'Hydra User', passwordHash: adminPassword, isEmailVerified: true, status: 'ACTIVE' },
        })
    ]);
    const [admin, sarah, marcus, emma, hydra] = users;
    console.log('✅ Users created:', users.map(u => u.name).join(', '));

    // 2. Create Organization
    const org = await prisma.organization.upsert({
        where: { slug: 'trickleup-demo' },
        update: {},
        create: { name: 'TrickleUp Corp', slug: 'trickleup-demo', plan: 'ENTERPRISE' },
    });
    console.log(`✅ Organization created: ${org.name}`);

    // 3. Departments, Teams, and Skills
    const dept = await prisma.department.upsert({
        where: { orgId_name: { orgId: org.id, name: 'Engineering' } },
        update: {},
        create: { orgId: org.id, name: 'Engineering', description: 'Software Development Team' }
    });
    const team = await prisma.team.upsert({
        where: { departmentId_name: { departmentId: dept.id, name: 'Frontend Squad' } },
        update: {},
        create: { departmentId: dept.id, name: 'Frontend Squad', description: 'React and UI experts' }
    });
    const skill = await prisma.employeeSkill.upsert({
        where: { orgId_name: { orgId: org.id, name: 'React.js' } },
        update: {},
        create: { orgId: org.id, name: 'React.js' }
    });
    console.log(`✅ HR structure created`);

    // 4. Create Roles
    const [ownerRole, adminRole, memberRole] = await Promise.all([
        prisma.role.upsert({
            where: { orgId_name: { orgId: org.id, name: 'Owner' } }, update: {},
            create: { orgId: org.id, name: 'Owner', permissions: ['*'], isSystem: true },
        }),
        prisma.role.upsert({
            where: { orgId_name: { orgId: org.id, name: 'Admin' } }, update: {},
            create: { orgId: org.id, name: 'Admin', isSystem: true, permissions: ['org:read', 'org:write'] },
        }),
        prisma.role.upsert({
            where: { orgId_name: { orgId: org.id, name: 'Member' } }, update: {},
            create: { orgId: org.id, name: 'Member', isDefault: true, isSystem: true, permissions: ['org:read'] },
        }),
    ]);

    // 5. Add members to Org and Teams
    const memberPromises = users.map(user =>
        prisma.orgMember.upsert({
            where: { userId_orgId: { userId: user.id, orgId: org.id } }, update: {},
            create: {
                userId: user.id, orgId: org.id,
                roleId: (user.id === admin.id || user.id === hydra.id) ? ownerRole.id : memberRole.id,
                departmentId: dept.id, teamId: team.id
            },
        })
    );
    const orgMembers = await Promise.all(memberPromises);
    console.log('✅ Users added to organization & teams');

    // 6. Hierarchy: Spaces, Folders, Lists
    const space = await prisma.space.upsert({
        where: { id: 'seed-space-all' }, update: {},
        create: { id: 'seed-space-all', orgId: org.id, name: 'Global Operations', color: '#6366f1' },
    });
    await prisma.spaceMember.upsert({
        where: { spaceId_userId: { spaceId: space.id, userId: hydra.id } },
        update: {},
        create: { spaceId: space.id, userId: hydra.id }
    });

    const folder = await prisma.folder.upsert({
        where: { id: 'seed-folder-all' }, update: {},
        create: { id: 'seed-folder-all', spaceId: space.id, orgId: org.id, name: 'Engineering Initiatives' },
    });

    const list = await prisma.list.upsert({
        where: { id: 'seed-list-all' }, update: {},
        create: { id: 'seed-list-all', orgId: org.id, spaceId: space.id, folderId: folder.id, name: 'Backend Rewrite', color: '#10b981' },
    });
    console.log(`✅ Hierarchy created (Space > Folder > List)`);

    // 7. Statuses and Tags
    const statusMap: Record<string, string> = {};
    for (const [key, name, color] of [['TODO', 'To Do', '#94a3b8'], ['IN_PROGRESS', 'In Progress', '#3b82f6'], ['DONE', 'Done', '#10b981']]) {
        const status = await prisma.status.upsert({
            where: { id: `status-${key}` }, update: {},
            create: { id: `status-${key}`, orgId: org.id, name, category: key, color }
        });
        statusMap[key] = status.id;
    }

    const tag1 = await prisma.tag.upsert({
        where: { orgId_name: { orgId: org.id, name: 'v2.0' } }, update: {}, create: { orgId: org.id, name: 'v2.0', color: '#ef4444' }
    });
    const tag2 = await prisma.tag.upsert({
        where: { orgId_name: { orgId: org.id, name: 'API' } }, update: {}, create: { orgId: org.id, name: 'API', color: '#8b5cf6' }
    });

    // Clean up task related data before recreating to avoid unique constraint issues
    await prisma.taskDependency.deleteMany();
    await prisma.checklistItem.deleteMany();
    await prisma.checklist.deleteMany();
    await prisma.timeEntry.deleteMany();
    await prisma.taskComment.deleteMany();
    await prisma.customFieldValue.deleteMany();
    await prisma.formSubmission.deleteMany();
    await prisma.task.deleteMany({ where: { listId: list.id } });
    await prisma.customField.deleteMany({ where: { orgId: org.id } });

    // 8. Custom Fields
    const cf = await prisma.customField.create({
        data: { orgId: org.id, name: 'Story Points', type: 'NUMBER' }
    });

    // 9. Tasks & Related Data (Dependencies, Checklists, TimeEntries, TaskComments)
    const task1 = await prisma.task.create({
        data: {
            listId: list.id, orgId: org.id, title: 'Refactor Core Logic', statusId: statusMap['IN_PROGRESS'],
            priority: 'HIGH', creatorId: admin.id, assigneeId: hydra.id, order: 0,
            tags: { connect: [{ id: tag1.id }, { id: tag2.id }] }
        }
    });

    const task2 = await prisma.task.create({
        data: {
            listId: list.id, orgId: org.id, title: 'Write Unit Tests for Core', statusId: statusMap['TODO'],
            priority: 'MEDIUM', creatorId: hydra.id, assigneeId: marcus.id, order: 1
        }
    });

    // Task Dependency
    await prisma.taskDependency.create({
        data: { blockingId: task1.id, waitingOnId: task2.id }
    });

    // Custom Field Value
    await prisma.customFieldValue.create({
        data: { taskId: task1.id, customFieldId: cf.id, value: 5 }
    });

    // Checklist
    const checklist = await prisma.checklist.create({ data: { taskId: task1.id, name: 'Refactoring Steps' } });
    await prisma.checklistItem.create({ data: { checklistId: checklist.id, name: 'Update interfaces', isResolved: true } });
    await prisma.checklistItem.create({ data: { checklistId: checklist.id, name: 'Implement new classes', isResolved: false } });

    // Time Entry
    await prisma.timeEntry.create({
        data: { taskId: task1.id, userId: hydra.id, duration: 3600, description: 'Worked on interfaces' }
    });

    // Task Comment
    await prisma.taskComment.create({
        data: { taskId: task1.id, userId: hydra.id, content: 'Making good progress on this!' }
    });
    console.log(`✅ Tasks and all attributes (Dependencies, Checklists, Comments, TimeEntries, Custom Fields) created`);

    // Clean up forms, goals, etc.
    await prisma.formField.deleteMany();
    await prisma.form.deleteMany({ where: { orgId: org.id } });
    await prisma.goalTarget.deleteMany();
    await prisma.goal.deleteMany({ where: { orgId: org.id } });
    await prisma.message.deleteMany();
    await prisma.channelMember.deleteMany();
    await prisma.channel.deleteMany({ where: { orgId: org.id } });
    await prisma.conversationMember.deleteMany();
    await prisma.conversation.deleteMany({ where: { orgId: org.id } });
    await prisma.document.deleteMany({ where: { orgId: org.id } });
    await prisma.automationAction.deleteMany();
    await prisma.automationRule.deleteMany({ where: { orgId: org.id } });
    await prisma.dashboardWidget.deleteMany();
    await prisma.dashboard.deleteMany({ where: { orgId: org.id } });
    await prisma.integration.deleteMany({ where: { orgId: org.id } });
    await prisma.webhook.deleteMany({ where: { orgId: org.id } });
    await prisma.aiOperation.deleteMany({ where: { orgId: org.id } });
    await prisma.favorite.deleteMany({ where: { orgId: org.id } });
    await prisma.notification.deleteMany({ where: { orgId: org.id } });
    await prisma.auditLog.deleteMany({ where: { orgId: org.id } });

    // 10. Forms
    const form = await prisma.form.create({
        data: { orgId: org.id, listId: list.id, name: 'Bug Report Form' }
    });
    await prisma.formField.create({
        data: { formId: form.id, type: 'TEXT', label: 'Bug Title', required: true, mapping: 'title' }
    });
    await prisma.formSubmission.create({
        data: { formId: form.id, taskId: task2.id, data: { 'Bug Title': 'System crashing on load' } }
    });

    // 11. Goals and Targets
    const goal = await prisma.goal.create({
        data: { orgId: org.id, name: 'Q3 Product Delivery', ownerId: hydra.id }
    });
    await prisma.goalTarget.create({
        data: { goalId: goal.id, name: 'Deploy rewritten backend', type: 'TRUE_FALSE', targetValue: 1, currentValue: 0 }
    });

    // 12. Channels, Conversations, Messages
    const channel = await prisma.channel.create({
        data: { orgId: org.id, name: 'general', description: 'General organization chat' }
    });
    await prisma.channelMember.create({ data: { channelId: channel.id, userId: hydra.id, role: 'ADMIN' } });
    await prisma.message.create({ data: { channelId: channel.id, userId: admin.id, content: 'Welcome to TrickleUp!' } });

    const dm = await prisma.conversation.create({ data: { orgId: org.id, isGroup: false } });
    await prisma.conversationMember.create({ data: { conversationId: dm.id, userId: hydra.id } });
    await prisma.conversationMember.create({ data: { conversationId: dm.id, userId: admin.id } });
    await prisma.message.create({ data: { conversationId: dm.id, userId: hydra.id, content: 'Hello Admin!' } });

    // 13. Documents
    await prisma.document.create({
        data: { orgId: org.id, spaceId: space.id, title: 'Engineering Handbook', content: '# Welcome\nHere are the docs!', creatorId: hydra.id }
    });

    // 14. Automations
    const rule = await prisma.automationRule.create({
        data: { orgId: org.id, listId: list.id, name: 'Auto-assign to Marcus', trigger: { type: 'STATUS_CHANGE', to: 'IN_REVIEW' } }
    });
    await prisma.automationAction.create({
        data: { ruleId: rule.id, type: 'ASSIGN_USER', payload: { userId: marcus.id } }
    });

    // 15. Dashboards & Widgets
    const dash = await prisma.dashboard.create({ data: { orgId: org.id, name: 'Team Overview' } });
    await prisma.dashboardWidget.create({
        data: { dashboardId: dash.id, type: 'BAR_CHART', name: 'Task Statuses', settings: { groupBy: 'status' } }
    });

    // 16. Integrations & Webhooks
    await prisma.integration.create({
        data: { orgId: org.id, provider: 'github', credentials: { token: 'mock-gh-token' } }
    });
    await prisma.webhook.create({
        data: { orgId: org.id, url: 'https://webhook.site/test', events: ['task.created'] }
    });

    // 17. AI Operations
    await prisma.aiOperation.create({
        data: { orgId: org.id, userId: hydra.id, action: 'summarize', prompt: 'Summarize tasks', response: 'You have 2 tasks.', status: 'COMPLETED', tokens: 150 }
    });

    // 18. Favorites
    await prisma.favorite.create({
        data: { orgId: org.id, userId: hydra.id, entityType: 'LIST', entityId: list.id }
    });

    // 19. Notifications and Audit Logs
    await prisma.notification.create({
        data: { orgId: org.id, userId: hydra.id, type: 'SYSTEM', title: 'Welcome', body: 'Welcome to your new account!' }
    });
    await prisma.auditLog.create({
        data: { orgId: org.id, userId: hydra.id, action: 'LOGIN', resource: 'Auth' }
    });

    console.log('✅ Secondary & advanced features populated (Docs, Automations, Integrations, Goals, Forms, Dashboards, Channels...)');

    console.log('\n🎉 Comprehensive EXHAUSTIVE test data generation complete!');
    console.log('You can now log in with:');
    console.log('Hydra: hydra@trickleup.io');
    console.log('Admin: admin@trickleup.io');
    console.log('PM: sarah@trickleup.io');
    console.log('Eng: marcus@trickleup.io');
    console.log('Design: emma@trickleup.io');
    console.log('Password for hydra & admin: Admin123!');
    console.log('Password for others: Password123!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
