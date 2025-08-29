diff --git a/app/admin/panel/add-admin.js b/app/admin/panel/add-user.js
index a16dd378567d3ec875e85e0e28c0becae7476d82..7fa18f4193e7a805be0019d79dbe0e85479b91f7 100644
--- a/app/admin/panel/add-admin.js
+++ b/app/admin/panel/add-user.js
@@ -1,45 +1,53 @@
 'use client'
 import { useState } from 'react'
 
-export default function AddAdminForm() {
+export default function AddUserForm() {
   const [name, setName] = useState('')
   const [username, setUsername] = useState('')
   const [password, setPassword] = useState('')
+  const [role, setRole] = useState('TECH')
   const [msg, setMsg] = useState('')
 
   async function onSubmit(e) {
     e.preventDefault()
     setMsg('')
     const res = await fetch('/api/admin/users', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
-      body: JSON.stringify({ name, username, password })
+      body: JSON.stringify({ name, username, password, role })
     })
     if (res.ok) {
-      setMsg('Admin ajouté.')
-      setName(''); setUsername(''); setPassword('')
+      setMsg('Utilisateur ajouté.')
+      setName(''); setUsername(''); setPassword(''); setRole('TECH')
       window.location.reload()
     } else {
       setMsg('Erreur: ' + await res.text())
     }
   }
 
   return (
-    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-4 items-end">
+    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-5 items-end">
       <div>
         <label className="label">Nom</label>
         <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Nom complet" required />
       </div>
       <div>
         <label className="label">Nom d'utilisateur</label>
         <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="adminX" required />
       </div>
       <div>
         <label className="label">Mot de passe</label>
         <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
       </div>
+      <div>
+        <label className="label">Rôle</label>
+        <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
+          <option value="TECH">Technicien</option>
+          <option value="ADMIN">Administrateur</option>
+        </select>
+      </div>
       <button className="btn btn-primary">Ajouter</button>
-      {msg && <p className="text-sm col-span-4">{msg}</p>}
+      {msg && <p className="text-sm col-span-5">{msg}</p>}
     </form>
   )
 }
