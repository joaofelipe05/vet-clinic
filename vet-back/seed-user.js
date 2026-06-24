import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function run() {
  const hash = await bcrypt.hash("123456", 10)

  await prisma.usuario.create({
    data: {
      nome: "Admin",
      email: "admin@test.com",
      senha: hash
    }
  })

  console.log("Usuário criado!")
}

run()