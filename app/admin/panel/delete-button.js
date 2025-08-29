diff --git a/app/admin/panel/delete-button.js b/app/admin/panel/delete-button.js
index e4eee7517858e7bae8a1c1643e2746fed9e06159..f4304a35535b5fbe2367025f7512566bf3b158c0 100644
--- a/app/admin/panel/delete-button.js
+++ b/app/admin/panel/delete-button.js
@@ -1,10 +1,10 @@
 'use client'
 export default function DeleteButton({ id }) {
   async function onDelete() {
-    if (!confirm('Supprimer cet admin ?')) return
+    if (!confirm('Supprimer cet utilisateur ?')) return
     const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
     if (res.ok) window.location.reload()
     else alert('Échec de la suppression.')
   }
   return <button className="btn" onClick={onDelete}>Supprimer</button>
 }
