// src/pages/Prontuario.jsx
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, abrirPDF as abrirPDFLib } from '../lib/api.js'
import toast from 'react-hot-toast'
import {
  Save, Printer, FileText, ChevronLeft, CheckCircle,
  Thermometer, Heart, Wind, Weight, User, Paperclip,
  X, Eye, Upload, Package, Plus, Trash2, Receipt, FileCheck
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const SECOES_BASICAS = [
  { id: 'anamnese',            label: 'Anamnese',                placeholder: 'Queixa principal, histórico relatado pelo tutor...', linhas: 3 },
  { id: 'diagnostico',         label: 'Diagnóstico',             placeholder: 'Diagnóstico definitivo...', linhas: 2 },
  { id: 'diagnosticoSuspeito', label: 'Hipótese diagnóstica',    placeholder: 'Diagnóstico suspeito / diferencial...', linhas: 2 },
  { id: 'tratamento',          label: 'Tratamento realizado',    placeholder: 'Procedimentos realizados na consulta...', linhas: 2 },
  { id: 'prescricao',          label: '💊 Prescrição / Receituário', placeholder: 'Ex:\n1. Amoxicilina 250mg — 1 comprimido a cada 8h por 7 dias\n2. Meloxicam — 1 gota/kg a cada 24h por 3 dias', linhas: 5, destaque: true },
  { id: 'orientacoes',         label: 'Orientações ao tutor',    placeholder: 'Cuidados em casa, restrições, alimentação...', linhas: 3 },
  { id: 'retorno',             label: 'Retorno',                 placeholder: 'Ex: Retornar em 7 dias ou se piorar', linhas: 1 },
]

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function ItensConsulta({ consultaId }) {
  const [itens, setItens] = useState([])
  const [todoEstoque, setTodoEstoque] = useState([])
  const [buscaItem, setBuscaItem] = useState('')
  const [itemSelecionado, setItemSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [adicionando, setAdicionando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [aberto, setAberto] = useState(false)

  async function carregarItens() {
    try {
      const res = await api.get(`/estoque/consulta/${consultaId}`)
      setItens(Array.isArray(res) ? res : [])
    } catch {}
  }

  async function carregarEstoque() {
    try {
      const res = await api.get('/estoque?limite=200')
      setTodoEstoque(Array.isArray(res) ? res : [])
    } catch {}
  }

  useEffect(() => {
    carregarItens()
    carregarEstoque()
  }, [consultaId])

  const estoqueFiltrado = todoEstoque.filter(i =>
    i.nome.toLowerCase().includes(buscaItem.toLowerCase())
  )

  async function adicionar() {
    if (!itemSelecionado) { toast.error('Selecione um item'); return }
    setAdicionando(true)
    try {
      await api.post(`/estoque/consulta/${consultaId}/adicionar`, {
        itemId: itemSelecionado,
        quantidade: Number(quantidade),
      })
      toast.success('Item adicionado!')
      setItemSelecionado('')
      setBuscaItem('')
      setQuantidade(1)
      carregarItens()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAdicionando(false)
    }
  }

  async function remover(itemConsultaId) {
    try {
      await api.delete(`/estoque/consulta/item/${itemConsultaId}`)
      carregarItens()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function confirmar() {
    setConfirmando(true)
    try {
      await api.patch(`/estoque/consulta/${consultaId}/confirmar`)
      toast.success('Itens confirmados — estoque atualizado!')
      carregarItens()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setConfirmando(false)
    }
  }

  const naoConfirmados = itens.filter(i => !i.confirmado)
  const total = itens.reduce((s, i) => s + (i.precoUnitario ?? 0) * i.quantidade, 0)

  return (
    <div className="card mb-4">
      <button
        onClick={() => setAberto(v => !v)}
        className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
      >
        <span className="flex items-center gap-2">
          <Package size={15} className="text-esmeralda-600" />
          Itens e materiais usados
          {itens.length > 0 && (
            <span className="badge bg-esmeralda-50 text-esmeralda-700 text-[10px]">
              {itens.length} item(ns)
            </span>
          )}
          {naoConfirmados.length > 0 && (
            <span className="badge bg-amber-50 text-amber-700 text-[10px]">
              {naoConfirmados.length} pendente(s)
            </span>
          )}
        </span>
        <span className="text-xs text-gray-400">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                className="input-base pr-3"
                placeholder="Buscar medicamento, vacina, material..."
                value={buscaItem}
                onChange={e => { setBuscaItem(e.target.value); setItemSelecionado('') }}
                list="estoque-list"
              />
              <datalist id="estoque-list">
                {estoqueFiltrado.slice(0, 10).map(i => (
                  <option key={i.id} value={i.nome} />
                ))}
              </datalist>
            </div>
            <select
              className="input-base w-48"
              value={itemSelecionado}
              onChange={e => setItemSelecionado(e.target.value)}
            >
              <option value="">— selecione —</option>
              {estoqueFiltrado.slice(0, 20).map(i => (
                <option key={i.id} value={i.id}>
                  {i.nome} ({i.quantidade} {i.unidade})
                </option>
              ))}
            </select>
            <input
              type="number" step="0.1" min="0.1"
              className="input-base w-20"
              placeholder="Qtd"
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
            />
            <button onClick={adicionar} disabled={adicionando} className="btn-primary px-3">
              <Plus size={16} />
            </button>
          </div>

          {itens.length > 0 && (
            <div className="divide-y divide-gray-50">
              {itens.map(ic => (
                <div key={ic.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{ic.item?.nome}</div>
                    <div className="text-xs text-gray-400">
                      {ic.quantidade} {ic.item?.unidade}
                      {ic.precoUnitario ? ` · R$ ${Number(ic.precoUnitario).toFixed(2)} cada` : ''}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {ic.precoUnitario ? `R$ ${(ic.precoUnitario * ic.quantidade).toFixed(2)}` : '—'}
                  </div>
                  {ic.confirmado ? (
                    <span className="badge bg-esmeralda-50 text-esmeralda-700 text-[10px]">deduzido ✓</span>
                  ) : (
                    <>
                      <span className="badge bg-amber-50 text-amber-700 text-[10px]">pendente</span>
                      <button onClick={() => remover(ic.id)} className="btn-ghost p-1 text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              ))}

              <div className="pt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Total em materiais: <span className="font-semibold text-gray-900">R$ {total.toFixed(2)}</span>
                </div>
                {naoConfirmados.length > 0 && (
                  <button onClick={confirmar} disabled={confirmando} className="btn-primary text-xs">
                    <CheckCircle size={13} />
                    {confirmando ? 'Confirmando...' : `Confirmar e deduzir (${naoConfirmados.length})`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Prontuario() {
  const { consultaId } = useParams()
  const navigate = useNavigate()

  const [consulta, setConsulta] = useState(null)
  const [prontuarioId, setProntuarioId] = useState(null)
  const [campos, setCampos] = useState({})
  const [vitais, setVitais] = useState({ temperatura:'', frequenciaCardiaca:'', frequenciaRespiratoria:'', pesoConsulta:'' })
  const [salvando, setSalvando] = useState(false)
  const [salvoEm, setSalvoEm] = useState(null)

  const [examesSolicitados, setExamesSolicitados] = useState('')
  const [resultadosTexto, setResultadosTexto] = useState('')
  const [arquivosExame, setArquivosExame] = useState([])
  const inputFileRef = useRef(null)

  useEffect(() => {
    async function carregar() {
      try {
        const [c, p] = await Promise.all([
          api.get(`/consultas/${consultaId}`),
          api.get(`/prontuarios/consulta/${consultaId}`),
        ])
        setConsulta(c)
        if (p) {
          setProntuarioId(p.id)
          const { temperatura, frequenciaCardiaca, frequenciaRespiratoria, pesoConsulta,
                  examesSolicitados: es, resultadosExames: re, ...resto } = p
          setVitais({
            temperatura:           temperatura           ?? '',
            frequenciaCardiaca:    frequenciaCardiaca    ?? '',
            frequenciaRespiratoria:frequenciaRespiratoria ?? '',
            pesoConsulta:          pesoConsulta          ?? '',
          })
          setExamesSolicitados(es ?? '')
          try {
            const parsed = JSON.parse(re ?? '{}')
            setResultadosTexto(parsed.texto ?? re ?? '')
            setArquivosExame(parsed.arquivos ?? [])
          } catch {
            setResultadosTexto(re ?? '')
            setArquivosExame([])
          }
          setCampos(resto)
        }
      } catch (err) {
        toast.error('Erro ao carregar consulta')
        console.error(err)
      }
    }
    carregar()
  }, [consultaId])

  useEffect(() => {
    const timer = setInterval(() => salvar(true), 30000)
    return () => clearInterval(timer)
  }, [campos, vitais, prontuarioId, examesSolicitados, resultadosTexto, arquivosExame])

  async function salvar(silencioso = false) {
    setSalvando(true)
    try {
      const payload = {
        ...campos,
        ...Object.fromEntries(
          Object.entries(vitais).map(([k, v]) => [k, v === '' ? null : Number(v)])
        ),
        examesSolicitados: examesSolicitados || null,
        resultadosExames: JSON.stringify({
          texto: resultadosTexto,
          arquivos: arquivosExame,
        }),
      }

      if (prontuarioId) {
        await api.put(`/prontuarios/${prontuarioId}`, payload)
      } else {
        const novo = await api.post('/prontuarios', { consultaId, ...payload })
        setProntuarioId(novo.id)
      }

      setSalvoEm(new Date())
      if (!silencioso) toast.success('Prontuário salvo!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function finalizar() {
    await salvar(true)
    try {
      await api.patch(`/consultas/${consultaId}/status`, { status: 'CONCLUIDA' })
      toast.success('Consulta finalizada!')
      navigate('/prontuarios')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleArquivos(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const MAX_MB = 5
    for (const f of files) {
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`${f.name} é maior que ${MAX_MB}MB`)
        continue
      }
      try {
        const base64 = await fileToBase64(f)
        setArquivosExame(prev => [...prev, { nome: f.name, tipo: f.type, tamanho: f.size, base64 }])
      } catch {
        toast.error(`Erro ao carregar ${f.name}`)
      }
    }
    e.target.value = ''
  }

  function removerArquivo(index) {
    setArquivosExame(prev => prev.filter((_, i) => i !== index))
  }

  function abrirArquivo(arquivo) {
    const win = window.open()
    if (arquivo.tipo?.startsWith('image/')) {
      win.document.write(`<img src="${arquivo.base64}" style="max-width:100%;height:auto" />`)
    } else {
      win.document.write(`<iframe src="${arquivo.base64}" style="width:100%;height:100vh;border:none"></iframe>`)
    }
  }

  // ── CORRIGIDO: usa abrirPDFLib do api.js em vez de window.open ──
  async function abrirPDF(tipo) {
    if (!prontuarioId) { toast.error('Salve o prontuário primeiro!'); return }
    try {
      await abrirPDFLib(`/pdf/${tipo}/${prontuarioId}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function abrirDocumento(tipo) {
    try {
      await abrirPDFLib(`/documentos/${tipo}/${consultaId}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  function formatarTamanho(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!consulta) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Carregando...</div>
  )

  const animal = consulta.animal
  const tutor  = animal?.tutor

  return (
    <div className="animate-slide-up max-w-4xl">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-6 -ml-1">
        <ChevronLeft size={16} /> Voltar
      </button>

      {/* Card do paciente */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-esmeralda-50 flex items-center justify-center text-2xl">
              {animal?.especie === 'CACHORRO' ? '🐕' : animal?.especie === 'GATO' ? '🐈' : '🐾'}
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-gray-900">{animal?.nome}</h1>
              <div className="text-sm text-gray-500 mt-0.5">
                {animal?.especie?.toLowerCase()} · {animal?.raca ?? 'raça não informada'} · {animal?.sexo?.toLowerCase()}
                {animal?.castrado ? ' · castrado(a)' : ''}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                <User size={11} />
                {tutor?.nome} · {tutor?.telefone}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700 capitalize">
              {format(new Date(consulta.dataHora), "d 'de' MMM 'de' yyyy · HH:mm", { locale: ptBR })}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{consulta.tipo} · {consulta.motivoVisita ?? '—'}</div>
            {salvoEm && (
              <div className="text-xs text-esmeralda-600 mt-1">
                Salvo às {format(salvoEm, 'HH:mm')}
              </div>
            )}
          </div>
        </div>
        {animal?.alergias && (
          <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700">
            ⚠️ <strong>Alergias:</strong> {animal.alergias}
          </div>
        )}
      </div>

      {/* Sinais vitais */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Heart size={15} className="text-esmeralda-600" /> Sinais vitais
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'temperatura',            label: 'Temperatura',    icon: Thermometer, sufixo: '°C',  placeholder: '38.5' },
            { id: 'frequenciaCardiaca',     label: 'Freq. Cardíaca', icon: Heart,       sufixo: 'bpm', placeholder: '80'   },
            { id: 'frequenciaRespiratoria', label: 'Freq. Resp.',    icon: Wind,        sufixo: 'rpm', placeholder: '20'   },
            { id: 'pesoConsulta',           label: 'Peso',           icon: Weight,      sufixo: 'kg',  placeholder: '10.5' },
          ].map(({ id, label, icon: Icon, sufixo, placeholder }) => (
            <div key={id}>
              <label className="field-label flex items-center gap-1">
                <Icon size={11} /> {label}
              </label>
              <div className="relative">
                <input
                  type="number" step="0.1"
                  className="input-base pr-10"
                  placeholder={placeholder}
                  value={vitais[id]}
                  onChange={e => setVitais(v => ({ ...v, [id]: e.target.value }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">{sufixo}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seções básicas */}
      <div className="space-y-4 mb-4">
        {SECOES_BASICAS.map(({ id, label, placeholder, linhas, destaque }) => (
          <div key={id} className={`card ${destaque ? 'ring-2 ring-esmeralda-200 border-esmeralda-200' : ''}`}>
            <label className={`field-label ${destaque ? 'text-esmeralda-700' : ''}`}>{label}</label>
            <textarea
              className="input-base font-mono text-sm"
              rows={linhas}
              placeholder={placeholder}
              value={campos[id] ?? ''}
              onChange={e => setCampos(c => ({ ...c, [id]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      {/* Exames */}
      <div className="card mb-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          🔬 Exames
        </h2>

        <div>
          <label className="field-label">Exames solicitados</label>
          <textarea
            className="input-base font-mono text-sm"
            rows={2}
            placeholder="Ex: Hemograma completo, bioquímico, urinálise, raio-x tórax..."
            value={examesSolicitados}
            onChange={e => setExamesSolicitados(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">Resultados — anotações / laudo em texto</label>
          <textarea
            className="input-base font-mono text-sm"
            rows={4}
            placeholder="Cole aqui os resultados, descreva os achados ou copie o laudo..."
            value={resultadosTexto}
            onChange={e => setResultadosTexto(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label flex items-center gap-1">
            <Paperclip size={11} /> Anexar exames (PDF, imagem)
          </label>
          <div
            onClick={() => inputFileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-esmeralda-300 hover:bg-esmeralda-50/30 transition-all"
          >
            <Upload size={20} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">Clique para selecionar arquivos</p>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — máx. 5 MB por arquivo</p>
          </div>
          <input
            ref={inputFileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={handleArquivos}
          />
          {arquivosExame.length > 0 && (
            <div className="mt-3 space-y-2">
              {arquivosExame.map((arq, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {arq.tipo?.startsWith('image/') ? '🖼️' : '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{arq.nome}</div>
                    <div className="text-xs text-gray-400">{formatarTamanho(arq.tamanho)}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => abrirArquivo(arq)} className="btn-ghost p-1.5 text-esmeralda-600 hover:bg-esmeralda-50" title="Visualizar">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => removerArquivo(i)} className="btn-ghost p-1.5 text-red-400 hover:bg-red-50" title="Remover">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Itens usados na consulta */}
      <ItensConsulta consultaId={consultaId} />

      {/* Botões de ação */}
      <div className="card no-print">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => salvar(false)} disabled={salvando} className="btn-primary">
            <Save size={16} />
            {salvando ? 'Salvando...' : 'Salvar prontuário'}
          </button>
          <button onClick={() => abrirPDF('prontuario')} className="btn-secondary">
            <Printer size={16} /> Imprimir prontuário
          </button>
          <button onClick={() => abrirPDF('receita')} className="btn-secondary">
            <FileText size={16} /> Imprimir receita
          </button>
          <button onClick={() => abrirDocumento('recibo')} className="btn-secondary">
            <Receipt size={16} /> Recibo não fiscal
          </button>
          <button onClick={() => abrirDocumento('nfse-modelo')} className="btn-secondary">
            <FileCheck size={16} /> Modelo NFS-e
          </button>
          <div className="flex-1" />
          <button onClick={finalizar} className="btn-primary bg-esmeralda-700 hover:bg-esmeralda-800">
            <CheckCircle size={16} /> Finalizar consulta
          </button>
        </div>
      </div>
    </div>
  )
}