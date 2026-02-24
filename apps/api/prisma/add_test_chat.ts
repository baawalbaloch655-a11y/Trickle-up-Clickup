import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating new user and chat...');

    const defaultPassword = await argon2.hash('Password123!');

    const newUser = await prisma.user.upsert({
        where: { email: 'alex@trickleup.io' },
        update: {},
        create: {
            email: 'alex@trickleup.io',
            name: 'Alex Johnson (New User)',
            passwordHash: defaultPassword,
            isEmailVerified: true,
            status: 'ACTIVE'
        },
    });

    const org = await prisma.organization.findUnique({
        where: { slug: 'trickleup-demo' }
    });

    if (!org) {
        console.error('Organization trickleup-demo not found!');
        return;
    }

    const memberRole = await prisma.role.findFirst({
        where: { orgId: org.id, name: 'Member' }
    });

    if (!memberRole) {
        console.error('Member role not found!');
        return;
    }

    await prisma.orgMember.upsert({
        where: { userId_orgId: { userId: newUser.id, orgId: org.id } },
        update: {},
        create: { userId: newUser.id, orgId: org.id, roleId: memberRole.id },
    });

    const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@trickleup.io' }
    });

    if (!adminUser) {
        console.error('Admin user not found!');
        return;
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
        where: {
            orgId: org.id,
            isGroup: false,
            members: {
                every: {
                    userId: {
                        in: [adminUser.id, newUser.id]
                    }
                }
            }
        }
    });

    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                orgId: org.id,
                isGroup: false,
                members: {
                    create: [
                        { userId: adminUser.id },
                        { userId: newUser.id }
                    ]
                },
                messages: {
                    create: [
                        { content: 'Hello Admin! I am a new user created for testing the chat.', userId: newUser.id }
                    ]
                }
            }
        });
        console.log('✅ Created new conversation between Admin and Alex.');
    } else {
        console.log('ℹ️ Conversation already exists.');
    }

    console.log('✅ Created user Alex Johnson (alex@trickleup.io)');
    console.log('You can test chatting by logging in with:');
    console.log('Email: alex@trickleup.io');
    console.log('Password: Password123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
