const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- JS DB AUDIT ---');
        const count = await prisma.timeEntry.count();
        console.log('Total TimeEntries:', count);

        const tasks = await prisma.task.findMany({
            where: { timeTracked: { gt: 0 } },
            take: 5
        });
        console.log('Tasks with timeTracked > 0:', tasks.length);
        tasks.forEach(t => console.log(`- Task ${t.id}: ${t.title} (${t.timeTracked})`));

        const assignments = await prisma.taskAssignment.findMany({
            where: { timeSpent: { gt: 0 } },
            take: 5
        });
        console.log('Assignments with timeSpent > 0:', assignments.length);
        assignments.forEach(a => console.log(`- Assignment ${a.id}: timeSpent=${a.timeSpent}`));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
