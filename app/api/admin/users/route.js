// app/api/admin/users/route.js
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const runtime = "nodejs"; // nécessaire pour bcryptjs (pas d'Edge)

// GET /api/admin/users
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ users });
}

// POST /api/admin/users
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  let { username, name, email, password, role } = body;

  username = username?.trim();
  name = name?.trim();
  email = email?.trim()?.toLowerCase();
  role = role === "ADMIN" ? "ADMIN" : "TECH";

  if (!username || !name || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password too short" }, { status: 400 });
  }

  const byUsername = await prisma.user.findUnique({ where: { username } });
  if (byUsername) return NextResponse.json({ error: "Username already exists" }, { status: 409 });

  let byEmail = null;
  if (email) {
    byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, name, email: email || null, passwordHash, role },
    select: { id: true, username: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user });
}
