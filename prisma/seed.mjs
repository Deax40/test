import { prisma } from '../lib/db.js';

async function main() {
  // Exemple: créer un utilisateur de test
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: { email: 'test@example.com', name: 'Test' }
  });
  console.log('Seed ok');
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
