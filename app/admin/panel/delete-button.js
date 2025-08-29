'use client'
export default function DeleteButton({ id }) {
  async function onDelete() {
    if (!confirm('Supprimer cet admin ?')) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) window.location.reload()
    else alert('Échec de la suppression.')
  }
  return <button className="btn" onClick={onDelete}>Supprimer</button>
}
