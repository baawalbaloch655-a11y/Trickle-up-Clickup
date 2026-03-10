const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- FINAL DATA AUDIT ---');
        const orgs = await prisma.organization.findMany({
            include: {
                _count: {
                    select: {
                        lists: true
                    }
                }
            }
        });

        console.log(`Found ${orgs.length} total organizations.`);
        for (const org of orgs) {
            const taskCount = await prisma.task.count({ where: { orgId: org.id } });
            const trackedTaskCount = await prisma.task.count({
                where: { orgId: org.id, timeTracked: { gt: 0 } }
            });
            console.log(`Org: ${org.name} (${org.id})`);
            console.log(`  - Lists: ${org._count.lists}`);
            console.log(`  - Total Tasks: ${taskCount}`);
            console.log(`  - Tasks with timeTracked > 0: ${trackedTaskCount}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
