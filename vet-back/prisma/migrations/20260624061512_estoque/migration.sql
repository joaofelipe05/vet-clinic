-- CreateEnum
CREATE TYPE "CategoriaItem" AS ENUM ('MEDICAMENTO', 'VACINA', 'PRODUTO', 'MATERIAL', 'SERVICO_CUSTO');

-- CreateEnum
CREATE TYPE "TipoMovimento" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE', 'PERDA');

-- CreateTable
CREATE TABLE "itens_estoque" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "CategoriaItem" NOT NULL DEFAULT 'PRODUTO',
    "descricao" TEXT,
    "unidade" TEXT NOT NULL DEFAULT 'un',
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantidadeMin" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "precoCusto" DOUBLE PRECISION,
    "precoVenda" DOUBLE PRECISION,
    "codigoBarras" TEXT,
    "fabricante" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMovimento" NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" TEXT NOT NULL,
    "consultaId" TEXT,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_consulta" (
    "id" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "precoUnitario" DOUBLE PRECISION,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consultaId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "itens_consulta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "itens_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consultas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_consulta" ADD CONSTRAINT "itens_consulta_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_consulta" ADD CONSTRAINT "itens_consulta_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "itens_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
