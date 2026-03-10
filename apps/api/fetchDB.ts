import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("Fetching spaces...");
    const spaces = await prisma.space.findMany({
        include: {
            folders: { include: { lists: true } },
            lists: true,
        }
    });
    console.log(JSON.stringify(spaces, null, 2));
    const allLists = await prisma.list.findMany();
    console.log("\nTotal lists:", allLists.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
