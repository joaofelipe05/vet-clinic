-- CreateEnum
CREATE TYPE "Especie" AS ENUM ('CACHORRO', 'GATO', 'AVE', 'REPTIL', 'ROEDOR', 'COELHO', 'OUTRO');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MACHO', 'FEMEA');

-- CreateEnum
CREATE TYPE "TipoConsulta" AS ENUM ('CONSULTA', 'RETORNO', 'CIRURGIA', 'EMERGENCIA', 'VACINA', 'EXAME', 'BANHO_TOSA');

-- CreateEnum
CREATE TYPE "StatusConsulta" AS ENUM ('AGENDADA', 'EM_ATENDIMENTO', 'CONCLUIDA', 'CANCELADA', 'NAO_COMPARECEU');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'PIX', 'BOLETO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "crmv" TEXT,
    "assinatura" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especie" "Especie" NOT NULL DEFAULT 'OUTRO',
    "raca" TEXT,
    "sexo" "Sexo" NOT NULL,
    "cor" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "peso" DOUBLE PRECISION,
    "microchip" TEXT,
    "castrado" BOOLEAN NOT NULL DEFAULT false,
    "alergias" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "tutorId" TEXT NOT NULL,

    CONSTRAINT "animais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas" (
    "id" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoConsulta" NOT NULL DEFAULT 'CONSULTA',
    "status" "StatusConsulta" NOT NULL DEFAULT 'AGENDADA',
    "motivoVisita" TEXT,
    "valor" DOUBLE PRECISION,
    "formaPagamento" "FormaPagamento",
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "animalId" TEXT NOT NULL,
    "veterinarioId" TEXT NOT NULL,

    CONSTRAINT "consultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prontuarios" (
    "id" TEXT NOT NULL,
    "anamnese" TEXT,
    "temperatura" DOUBLE PRECISION,
    "frequenciaCardiaca" INTEGER,
    "frequenciaRespiratoria" INTEGER,
    "pesoConsulta" DOUBLE PRECISION,
    "mucosas" TEXT,
    "hidratacao" TEXT,
    "linfonodos" TEXT,
    "ausculta" TEXT,
    "exameAbdome" TEXT,
    "exameOrtopedico" TEXT,
    "outrosAchados" TEXT,
    "diagnostico" TEXT,
    "diagnosticoSuspeito" TEXT,
    "examesSolicitados" TEXT,
    "resultadosExames" TEXT,
    "prescricao" TEXT,
    "tratamento" TEXT,
    "retorno" TEXT,
    "orientacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "consultaId" TEXT NOT NULL,

    CONSTRAINT "prontuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacinas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataAplicacao" TIMESTAMP(3) NOT NULL,
    "proximaDose" TIMESTAMP(3),
    "lote" TEXT,
    "fabricante" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "animalId" TEXT NOT NULL,

    CONSTRAINT "vacinas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tutores_cpf_key" ON "tutores"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "animais_microchip_key" ON "animais"("microchip");

-- CreateIndex
CREATE UNIQUE INDEX "prontuarios_consultaId_key" ON "prontuarios"("consultaId");

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_veterinarioId_fkey" FOREIGN KEY ("veterinarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prontuarios" ADD CONSTRAINT "prontuarios_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacinas" ADD CONSTRAINT "vacinas_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
