import { PrismaClient } from '@prisma/client';

async function debug() {
    const prisma = new PrismaClient();
    try {
        console.log('--- Debugging Analytics Query ---');

        // Find the admin organization
        const org = await prisma.organization.findFirst({
            where: { name: { contains: 'TrickleUp' } }
        });

        if (!org) {
            console.log('Organization not found');
            return;
        }

        console.log(`Using Org ID: ${org.id} (${org.name})`);

        // Check total time entries for this org
        const totalEntries = await prisma.timeEntry.count({
            where: {
                task: { orgId: org.id }
            }
        });
        console.log(`Total Time Entries for Org: ${totalEntries}`);

        // List some entries if they exist
        if (totalEntries > 0) {
            const entries = await prisma.timeEntry.findMany({
                where: { task: { orgId: org.id } },
                include: { task: { select: { title: true, orgId: true } } },
                take: 5
            });
            console.log('Sample Entries:', JSON.stringify(entries, null, 2));
        }

        // Check date filtering
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - 30); // Last 30 days

        const filteredEntries = await prisma.timeEntry.count({
            where: {
                task: { orgId: org.id },
                startTime: { gte: start }
            }
        });
        console.log(`Entries in last 30 days: ${filteredEntries}`);

        // Check if any TimeEntry doesn't have a Task (shouldn't be possible but let's check)
        const orphanEntries = await prisma.timeEntry.count({
            where: { taskId: null as any }
        });
        console.log(`Time entries with null taskId: ${orphanEntries}`);

        // Check Tasks timeTracked sum vs TimeEntry sum
        const tasksWithTime = await prisma.task.aggregate({
            where: { orgId: org.id },
            _sum: { timeTracked: true }
        });
        console.log(`Sum of timeTracked on Tasks: ${tasksWithTime._sum.timeTracked}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
