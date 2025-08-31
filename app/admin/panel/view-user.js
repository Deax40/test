'use client'

export default function ViewUserButton({ user }) {
  function onView() {
    const info = `Nom: ${user.name}\nNom d'utilisateur: ${user.username}\nEmail: ${user.email || '—'}\nRôle: ${user.role}\nCréé le: ${new Date(user.createdAt).toLocaleString('fr-FR')}\nMot de passe: ${user.passwordHash}`;
    alert(info);
  }
  return <button className="btn" onClick={onView}>Voir</button>;
}
