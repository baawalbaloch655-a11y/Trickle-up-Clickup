const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    const orgId = 'e9a29094-cf1b-4bef-a833-14988e52e2e2';
    try {
        console.log(`--- DEBUGGING ANALYTICS LOGIC for ${orgId} ---`);

        // 1. Check direct query
        const tasks = await prisma.task.findMany({
            where: { orgId, timeTracked: { gt: 0 }, deletedAt: null },
            include: { list: { select: { name: true } } }
        });
        console.log('Direct Task Count:', tasks.length);

        // 2. Run the actual aggregation logic
        const listStats = {};
        tasks.forEach(task => {
            const listName = task.list?.name || 'Uncategorized';
            if (!listStats[listName]) listStats[listName] = 0;
            listStats[listName] += (task.timeTracked || 0);
        });

        const result = Object.entries(listStats).map(([name, seconds]) => ({ name, hours: (seconds) / 3600 }));
        console.log('Resulting listStats:', JSON.stringify(result, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
