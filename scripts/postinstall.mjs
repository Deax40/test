import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const rootDir = process.cwd();
const prismaBinaryName = process.platform === 'win32' ? 'prisma.cmd' : 'prisma';
const prismaCli = join(rootDir, 'node_modules', '.bin', prismaBinaryName);

function runStep(title, command, args) {
  console.log(`\n➡️  ${title}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(`${title} a échoué (code ${result.status}).`);
  }
}

try {
  if (!existsSync(prismaCli)) {
    throw new Error(`Binaire Prisma introuvable (${prismaCli}). Assurez-vous que les dépendances sont installées.`);
  }

  runStep('Génération du client Prisma', prismaCli, ['generate']);

  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL n'est pas défini, migration et seed ignorés.");
    process.exit(0);
  }

  runStep('Application des migrations Prisma', prismaCli, ['migrate', 'deploy']);
  runStep('Insertion des données initiales', process.execPath, [join(rootDir, 'prisma', 'seed.mjs')]);

  console.log('\n✅ Base de données prête.');
} catch (error) {
  console.error('\n❌ Échec de la configuration Prisma :', error.message ?? error);
  process.exit(1);
}
