import { getAllTools } from '@/lib/tools';

export const dynamic = 'force-dynamic';

function displayValue(value) {
  if (!value) {
    return '—';
  }

  return value;
}

export default async function CommonPage() {
  const tools = await getAllTools();

  return (
    <main>
      <h1>Base des outils</h1>
      <p style={{ color: '#4b5563' }}>
        Liste centralisée de tous les outils enregistrés. Les informations visibles peuvent être
        mises à jour via l'onglet Scan.
      </p>
      <div style={{ marginTop: 24, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#f3f4f6' }}>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>Outil</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>Identifiant</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>Poids</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>Date</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>Dernière personne</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>Dimensions</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => (
              <tr key={tool.hash} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{tool.label}</td>
                <td style={{ padding: '12px 16px' }}>{displayValue(tool.identifier)}</td>
                <td style={{ padding: '12px 16px' }}>{displayValue(tool.weight)}</td>
                <td style={{ padding: '12px 16px' }}>{displayValue(tool.date)}</td>
                <td style={{ padding: '12px 16px' }}>{displayValue(tool.lastUser)}</td>
                <td style={{ padding: '12px 16px' }}>{displayValue(tool.dimensions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
