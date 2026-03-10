import { PrismaClient } from '@prisma/client';

async function debug() {
    const prisma = new PrismaClient();
    try {
        console.log('--- EXHAUSTIVE DATA AUDIT ---');

        const orgs = await prisma.organization.findMany();
        console.log(`Found ${orgs.length} organizations:`, orgs.map(o => `${o.id}: ${o.name}`));

        if (orgs.length === 0) return;

        for (const org of orgs) {
            console.log(`\nAudit for Org: ${org.name} (${org.id})`);

            const totalTasks = await prisma.task.count({ where: { orgId: org.id } });
            console.log(`  Total Tasks: ${totalTasks}`);

            const tasksWithEstimate = await prisma.task.count({
                where: { orgId: org.id, timeEstimate: { not: null } }
            });
            console.log(`  Tasks with Estimate: ${tasksWithEstimate}`);

            const totalTimeEntries = await prisma.timeEntry.count({
                where: { task: { orgId: org.id } }
            });
            console.log(`  Total Time Entries (via Task Org): ${totalTimeEntries}`);

            if (totalTimeEntries > 0) {
                const sample = await prisma.timeEntry.findFirst({
                    where: { task: { orgId: org.id } },
                    include: { task: true }
                });
                console.log(`  Sample Entry OrgId: ${sample?.task?.orgId}`);
                console.log(`  Sample Entry Start: ${sample?.startTime}`);
            }
        }

        // Just check ANY time entry in the DB regardless of org
        const globalTimeEntries = await prisma.timeEntry.count();
        console.log(`\nGLOBAL TOTAL TIME ENTRIES: ${globalTimeEntries}`);

    } catch (e) {
        console.error('Audit failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
