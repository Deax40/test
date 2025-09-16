import { prisma } from '@/lib/db.js';
import { displayValue, formatDate } from '@/lib/formatters.js';

export const dynamic = 'force-dynamic';

export default async function CommonPage() {
  const tools = await prisma.tool.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <>
      <div className="section-card">
        <h1>Base Common</h1>
        <p>
          Toutes les informations visibles relatives aux outils sont centralisées ici. Les hashes uniques
          restent réservés à la base de données afin de garantir la correspondance sécurisée avec les QR codes.
        </p>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Outil</th>
              <th>Contact</th>
              <th>Poids</th>
              <th>Date</th>
              <th>Dernière personne</th>
              <th>Dimensions</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => (
              <tr key={tool.id}>
                <td>{tool.name}</td>
                <td>{displayValue(tool.contact)}</td>
                <td>{displayValue(tool.weight)}</td>
                <td>{formatDate(tool.referenceDate)}</td>
                <td>{displayValue(tool.lastUser)}</td>
                <td>{displayValue(tool.dimensions)}</td>
                <td>{displayValue(tool.notes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
