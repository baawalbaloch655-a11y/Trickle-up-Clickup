import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding TrickleUp database with comprehensive test data...');

    // 1. Create Users
    const defaultPassword = await argon2.hash('Password123!');
    const users = await Promise.all([
        prisma.user.upsert({
            where: { email: 'admin@trickleup.io' },
            update: {},
            create: { email: 'admin@trickleup.io', name: 'TrickleUp Admin', passwordHash: defaultPassword, isEmailVerified: true, status: 'ACTIVE' },
        }),
        prisma.user.upsert({
            where: { email: 'sarah@trickleup.io' },
            update: {},
            create: { email: 'sarah@trickleup.io', name: 'Sarah Chen (PM)', passwordHash: defaultPassword, isEmailVerified: true, status: 'ACTIVE' },
        }),
        prisma.user.upsert({
            where: { email: 'marcus@trickleup.io' },
            update: {},
            create: { email: 'marcus@trickleup.io', name: 'Marcus Doe (Eng)', passwordHash: defaultPassword, isEmailVerified: true, status: 'ACTIVE' },
        }),
        prisma.user.upsert({
            where: { email: 'emma@trickleup.io' },
            update: {},
            create: { email: 'emma@trickleup.io', name: 'Emma Watson (UI/UX)', passwordHash: defaultPassword, isEmailVerified: true, status: 'ACTIVE' },
        })
    ]);
    const [admin, sarah, marcus, emma] = users;
    console.log('✅ Users created:', users.map(u => u.name).join(', '));

    // 2. Create demo organization
    const org = await prisma.organization.upsert({
        where: { slug: 'trickleup-demo' },
        update: {},
        create: { name: 'TrickleUp Corp', slug: 'trickleup-demo', plan: 'ENTERPRISE' },
    });
    console.log(`✅ Org: ${org.name}`);

    // 3. Create system roles
    const [ownerRole, adminRole, memberRole, viewerRole] = await Promise.all([
        prisma.role.upsert({
            where: { orgId_name: { orgId: org.id, name: 'Owner' } },
            update: {},
            create: { orgId: org.id, name: 'Owner', permissions: ['*'], isSystem: true },
        }),
        prisma.role.upsert({
            where: { orgId_name: { orgId: org.id, name: 'Admin' } },
            update: {},
            create: {
                orgId: org.id, name: 'Admin', isSystem: true,
                permissions: ['org:read', 'org:write', 'members:read', 'members:write', 'projects:read', 'projects:write', 'tasks:read', 'tasks:write', 'files:read', 'files:write'],
            },
        }),
        prisma.role.upsert({
            where: { orgId_name: { orgId: org.id, name: 'Member' } },
            update: {},
            create: {
                orgId: org.id, name: 'Member', isDefault: true, isSystem: true,
                permissions: ['org:read', 'members:read', 'projects:read', 'tasks:read', 'tasks:write', 'files:read'],
            },
        }),
        prisma.role.upsert({
            where: { orgId_name: { orgId: org.id, name: 'Viewer' } },
            update: {},
            create: {
                orgId: org.id, name: 'Viewer', isSystem: true,
                permissions: ['org:read', 'projects:read', 'tasks:read'],
            },
        }),
    ]);

    // 4. Add users to Org
    const memberPromises = users.map(user =>
        prisma.orgMember.upsert({
            where: { userId_orgId: { userId: user.id, orgId: org.id } },
            update: {},
            create: { userId: user.id, orgId: org.id, roleId: user.id === admin.id ? ownerRole.id : memberRole.id },
        })
    );
    await Promise.all(memberPromises);
    console.log('✅ Users added to organization');

    // 5. Create Workspace Hierarchy (Spaces)
    const spaceProduct = await prisma.space.upsert({
        where: { id: 'seed-space-1' },
        update: {},
        create: { id: 'seed-space-1', orgId: org.id, name: 'Product Development', description: 'Core product management space', color: '#6366f1' },
    });
    const spaceMarketing = await prisma.space.upsert({
        where: { id: 'seed-space-2' },
        update: {},
        create: { id: 'seed-space-2', orgId: org.id, name: 'Marketing & Design', description: 'GTM and Brand', color: '#ec4899' },
    });
    console.log(`✅ Spaces created`);

    // 6. Create Folders
    const fRoadmap = await prisma.folder.upsert({
        where: { id: 'seed-folder-1' },
        update: {},
        create: { id: 'seed-folder-1', spaceId: spaceProduct.id, orgId: org.id, name: 'Roadmap & Planning' },
    });
    const fEngineering = await prisma.folder.upsert({
        where: { id: 'seed-folder-2' },
        update: {},
        create: { id: 'seed-folder-2', spaceId: spaceProduct.id, orgId: org.id, name: 'Engineering' },
    });
    const fCampaigns = await prisma.folder.upsert({
        where: { id: 'seed-folder-3' },
        update: {},
        create: { id: 'seed-folder-3', spaceId: spaceMarketing.id, orgId: org.id, name: 'Campaigns' },
    });
    console.log(`✅ Folders created`);

    // 7. Create Lists
    const platformLaunch = await prisma.list.upsert({
        where: { id: 'seed-list-1' },
        update: {},
        create: { id: 'seed-list-1', orgId: org.id, spaceId: spaceProduct.id, folderId: fRoadmap.id, name: 'Platform Launch', color: '#6366f1' },
    });
    const backendServices = await prisma.list.upsert({
        where: { id: 'seed-list-2' },
        update: {},
        create: { id: 'seed-list-2', orgId: org.id, spaceId: spaceProduct.id, folderId: fEngineering.id, name: 'Backend Services', color: '#10b981' },
    });
    const websiteRevamp = await prisma.list.upsert({
        where: { id: 'seed-list-3' },
        update: {},
        create: { id: 'seed-list-3', orgId: org.id, spaceId: spaceMarketing.id, folderId: fCampaigns.id, name: 'Website Revamp', color: '#f59e0b' },
    });
    console.log(`✅ Lists created`);

    // 8. Helpers for dates and time
    const today = new Date();
    const daysAgo = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    const daysLater = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const minutesToSeconds = (h: number, m: number) => (h * 60 + m) * 60;

    // 9. Generate vast tasks
    const allTasks = [
        // Platform Launch Tasks
        { listId: platformLaunch.id, title: 'Setup CI/CD pipeline', status: 'DONE', priority: 'HIGH', assigneeId: marcus.id, dueDate: daysAgo(5), timeTracked: minutesToSeconds(12, 30), comments: 2 },
        { listId: platformLaunch.id, title: 'Design system implementation', status: 'IN_REVIEW', priority: 'MEDIUM', assigneeId: emma.id, dueDate: daysAgo(2), timeTracked: minutesToSeconds(8, 0), comments: 5 },
        { listId: platformLaunch.id, title: 'API endpoint documentation', status: 'IN_PROGRESS', priority: 'LOW', assigneeId: admin.id, dueDate: today, timeTracked: minutesToSeconds(2, 0), comments: 0 },
        { listId: platformLaunch.id, title: 'User onboarding flow', status: 'TODO', priority: 'URGENT', assigneeId: sarah.id, dueDate: daysLater(1), timeTracked: 0, comments: 1 },
        { listId: platformLaunch.id, title: 'Email notification templates', status: 'TODO', priority: 'HIGH', assigneeId: marcus.id, dueDate: daysLater(3), timeTracked: 0, comments: 0 },
        { listId: platformLaunch.id, title: 'Analytics dashboard', status: 'TODO', priority: 'MEDIUM', assigneeId: admin.id, dueDate: daysLater(7), timeTracked: 0, comments: 0 },
        { listId: platformLaunch.id, title: 'Mobile responsive testing', status: 'IN_REVIEW', priority: 'HIGH', assigneeId: emma.id, dueDate: daysAgo(1), timeTracked: minutesToSeconds(5, 15), comments: 3 },
        { listId: platformLaunch.id, title: 'Performance audit', status: 'TODO', priority: 'MEDIUM', assigneeId: null, dueDate: daysLater(30), timeTracked: 0, comments: 0 },
        { listId: platformLaunch.id, title: 'Security review', status: 'DONE', priority: 'URGENT', assigneeId: marcus.id, dueDate: daysAgo(7), timeTracked: minutesToSeconds(15, 0), comments: 1 },
        { listId: platformLaunch.id, title: 'Refactoring Auth module', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: marcus.id, dueDate: today, timeTracked: minutesToSeconds(4, 30), comments: 4 },

        // Backend Services Tasks
        { listId: backendServices.id, title: 'Microservices architecture design', status: 'DONE', priority: 'URGENT', assigneeId: marcus.id, dueDate: daysAgo(10), timeTracked: minutesToSeconds(20, 0), comments: 8 },
        { listId: backendServices.id, title: 'Database optimization script', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: marcus.id, dueDate: daysLater(2), timeTracked: minutesToSeconds(3, 10), comments: 0 },
        { listId: backendServices.id, title: 'Redis caching layer', status: 'TODO', priority: 'MEDIUM', assigneeId: admin.id, dueDate: daysLater(5), timeTracked: 0, comments: 2 },

        // Website Revamp Tasks (Matching the image)
        { listId: websiteRevamp.id, title: 'Creatives Resizing For Donation Focus', status: 'IN_REVIEW', priority: 'HIGH', assigneeId: emma.id, dueDate: daysAgo(2), timeTracked: 0, comments: 5 },
        { listId: websiteRevamp.id, title: 'Additional Coupon Code Creative', status: 'IN_REVIEW', priority: 'URGENT', assigneeId: sarah.id, dueDate: daysAgo(1), timeTracked: minutesToSeconds(1, 3), comments: 5 },
        { listId: websiteRevamp.id, title: 'Research and Ideation', status: 'DONE', priority: 'LOW', assigneeId: emma.id, dueDate: daysAgo(2), timeTracked: minutesToSeconds(2, 6), comments: 0 },
        { listId: websiteRevamp.id, title: '2025 Impact Compilation Video', status: 'DONE', priority: 'MEDIUM', assigneeId: null, dueDate: daysAgo(4), timeTracked: minutesToSeconds(2, 8), comments: 2 },
    ];

    for (let i = 0; i < allTasks.length; i++) {
        const t = allTasks[i];
        const task = await prisma.task.upsert({
            where: { id: `seed-task-auto-${i}` },
            update: {
                title: t.title,
                status: t.status as any,
                priority: t.priority as any,
                assigneeId: t.assigneeId,
                dueDate: t.dueDate,
                timeTracked: t.timeTracked,
            },
            create: {
                id: `seed-task-auto-${i}`,
                listId: t.listId,
                orgId: org.id,
                title: t.title,
                status: t.status as any,
                priority: t.priority as any,
                creatorId: admin.id,
                assigneeId: t.assigneeId,
                dueDate: t.dueDate,
                order: i,
                timeTracked: t.timeTracked,
            },
        });

        // Add dummy comments
        if (t.comments > 0) {
            for (let j = 0; j < t.comments; j++) {
                await prisma.taskComment.create({
                    data: {
                        taskId: task.id,
                        userId: admin.id,
                        content: `This is dummy comment ${j + 1}`
                    }
                });
            }
        }
    }
    console.log(`✅ ${allTasks.length} Sample tasks created with comments and time tracking`);

    console.log('\n🎉 Comprehensive test data generation complete!');
    console.log('You can now log in with:');
    console.log('Admin: admin@trickleup.io');
    console.log('PM: sarah@trickleup.io');
    console.log('Eng: marcus@trickleup.io');
    console.log('Design: emma@trickleup.io');
    console.log('Password for all: Password123!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
