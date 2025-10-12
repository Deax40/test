import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.username }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = params
    const updateData = await request.json()

    // Vérifier que l'utilisateur à modifier existe
    const targetUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Préparer les données de mise à jour
    const updateFields = {}

    if (updateData.name !== undefined) {
      updateFields.name = updateData.name
    }

    if (updateData.email !== undefined) {
      // Vérifier si l'email n'est pas déjà utilisé
      if (updateData.email && updateData.email !== targetUser.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updateData.email }
        })
        if (existingUser && existingUser.id !== id) {
          return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
        }
      }
      updateFields.email = updateData.email || null
    }

    if (updateData.role !== undefined) {
      updateFields.role = updateData.role
    }

    if (updateData.password) {
      updateFields.passwordHash = await bcrypt.hash(updateData.password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateFields,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.username }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = params

    // Vérifier que l'utilisateur à supprimer existe
    const targetUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Empêcher la suppression de son propre compte
    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 })
    }

    // Supprimer l'utilisateur (les relations seront gérées par les contraintes de la base)
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}