// src/pages/Estoque.jsx
import { useEffect, useState } from 'react'
import { Plus, Search, Package, AlertTriangle, ArrowDown, ArrowUp, Edit2, X } from 'lucide-react'
import { api } from '../lib/api.js'
import toast from 'react-hot-toast'

const CATEGORIA_LABEL = {
  MEDICAMENTO:   'Medicamento',
  VACINA:        'Vacina',
  PRODUTO:       'Produto',
  MATERIAL:      'Material',
  SERVICO_CUSTO: 'Serviço c/ custo',
}
const CATEGORIA_COR = {
  MEDICAMENTO:   'bg-blue-50 text-blue-700',
  VACINA:        'bg-esmeralda-50 text-esmeralda-700',
  PRODUTO:       'bg-purple-50 text-purple-700',
  MATERIAL:      'bg-amber-50 text-amber-700',
  SERVICO_CUSTO: 'bg-orange-50 text-orange-700',
}
const CATEGORIAS = Object.keys(CATEGORIA_LABEL)

function ModalItem({ item, onClose, onSalvo }) {
  const [form, setForm] = useState({
    nome: '', categoria: 'MEDICAMENTO', descricao: '', unidade: 'un',
    quantidade: 0, quantidadeMin: 5, precoCusto: '', precoVenda: '',
    fabricante: '', codigoBarras: '',
    ...item,
  })
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!form.nome) { toast.error('Nome obrigatório'); return }
    setSalvando(true)
    try {
      const payload = {
        ...form,
        quantidade:    Number(form.quantidade),
        quantidadeMin: Number(form.quantidadeMin),
        precoCusto:    form.precoCusto  ? Number(form.precoCusto)  : null,
        precoVenda:    form.precoVenda  ? Number(form.precoVenda)  : null,
      }
      if (item?.id) await api.put(`/estoque/${item.id}`, payload)
      else          await api.post('/estoque', payload)
      toast.success(item?.id ? 'Item atualizado!' : 'Item cadastrado!')
      onSalvo()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg mx-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900">{item?.id ? 'Editar item' : 'Novo item no estoque'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="field-label">Nome *</label>
            <input className="input-base" placeholder="Ex: Amoxicilina 250mg"
              value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Categoria</label>
              <select className="input-base" value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Unidade</label>
              <input className="input-base" placeholder="un, ml, mg, cx, fr"
                value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Quantidade atual</label>
              <input type="number" step="0.1" className="input-base"
                value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Alerta mínimo</label>
              <input type="number" step="0.1" className="input-base"
                value={form.quantidadeMin} onChange={e => setForm(f => ({ ...f, quantidadeMin: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Preço de custo (R$)</label>
              <input type="number" step="0.01" className="input-base" placeholder="0,00"
                value={form.precoCusto} onChange={e => setForm(f => ({ ...f, precoCusto: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Preço de venda (R$)</label>
              <input type="number" step="0.01" className="input-base" placeholder="0,00"
                value={form.precoVenda} onChange={e => setForm(f => ({ ...f, precoVenda: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="field-label">Fabricante</label>
            <input className="input-base" placeholder="Ex: Boehringer"
              value={form.fabricante ?? ''} onChange={e => setForm(f => ({ ...f, fabricante: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Descrição / observações</label>
            <textarea className="input-base" rows={2}
              value={form.descricao ?? ''} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalMovimentar({ item, onClose, onSalvo }) {
  const [tipo, setTipo] = useState('ENTRADA')
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!quantidade || Number(quantidade) <= 0) { toast.error('Quantidade inválida'); return }
    setSalvando(true)
    try {
      await api.post(`/estoque/${item.id}/movimentar`, {
        tipo,
        quantidade: Number(quantidade),
        motivo: motivo || null,
      })
      toast.success('Movimentação registrada!')
      onSalvo()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Movimentar estoque</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-sm font-medium text-gray-900">{item.nome}</div>
            <div className="text-xs text-gray-400">Estoque atual: {item.quantidade} {item.unidade}</div>
          </div>
          <div>
            <label className="field-label">Tipo</label>
            <div className="flex gap-2">
              {[['ENTRADA','Entrada'],['AJUSTE','Ajuste'],['PERDA','Perda']].map(([val, lbl]) => (
                <button key={val} onClick={() => setTipo(val)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                    tipo === val
                      ? val === 'ENTRADA'
                        ? 'bg-esmeralda-600 text-white border-esmeralda-600'
                        : val === 'PERDA'
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Quantidade ({item.unidade})</label>
            <input type="number" step="0.1" className="input-base" placeholder="0"
              value={quantidade} onChange={e => setQuantidade(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Motivo (opcional)</label>
            <input className="input-base" placeholder="Ex: Compra nota 1234, vencimento..."
              value={motivo} onChange={e => setMotivo(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center">
            {salvando ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Estoque() {
  const [itens, setItens] = useState([])
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalItem, setModalItem] = useState(null)      // null | {} | {item existente}
  const [modalMov, setModalMov] = useState(null)
  const [apenasAlerta, setApenasAlerta] = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busca)       params.set('busca', busca)
      if (categoria)   params.set('categoria', categoria)
      if (apenasAlerta)params.set('alerta', 'true')
      const res = await api.get(`/estoque?${params}`)
      setItens(Array.isArray(res) ? res : [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])
  useEffect(() => {
    const t = setTimeout(carregar, 350)
    return () => clearTimeout(t)
  }, [busca, categoria, apenasAlerta])

  const alertas = itens.filter(i => i.estoqueBaixo).length

  return (
    <div className="animate-slide-up">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Estoque</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {itens.length} itens cadastrados
            {alertas > 0 && (
              <span className="ml-2 badge bg-red-50 text-red-600">
                <AlertTriangle size={10} /> {alertas} com estoque baixo
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setModalItem({})} className="btn-primary">
          <Plus size={16} /> Novo item
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-base pl-9 w-56" placeholder="Buscar item..."
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <select className="input-base w-44" value={categoria} onChange={e => setCategoria(e.target.value)}>
          <option value="">Todas categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
        </select>
        <button
          onClick={() => setApenasAlerta(v => !v)}
          className={`badge px-3 py-1.5 cursor-pointer border transition-all ${
            apenasAlerta ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-500 border-gray-200'
          }`}
        >
          <AlertTriangle size={11} /> Só alertas
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>
        ) : itens.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum item encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Header */}
            <div className="grid grid-cols-[1fr_100px_100px_100px_110px_90px] gap-3 pb-2 px-2">
              {['Item','Categoria','Estoque','Mínimo','Preço venda',''].map(h => (
                <div key={h} className="text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</div>
              ))}
            </div>

            {itens.map(item => (
              <div key={item.id}
                className="grid grid-cols-[1fr_100px_100px_100px_110px_90px] gap-3 py-3.5 px-2 items-center hover:bg-gray-50 rounded-xl transition-colors">

                <div>
                  <div className="text-sm font-medium text-gray-900">{item.nome}</div>
                  {item.fabricante && <div className="text-xs text-gray-400">{item.fabricante}</div>}
                </div>

                <span className={`badge text-[10px] w-fit ${CATEGORIA_COR[item.categoria]}`}>
                  {CATEGORIA_LABEL[item.categoria]}
                </span>

                <div className={`text-sm font-semibold ${item.estoqueBaixo ? 'text-red-600' : 'text-gray-900'}`}>
                  {item.estoqueBaixo && <AlertTriangle size={11} className="inline mr-1" />}
                  {item.quantidade} {item.unidade}
                </div>

                <div className="text-sm text-gray-500">{item.quantidadeMin} {item.unidade}</div>

                <div className="text-sm text-gray-700">
                  {item.precoVenda ? `R$ ${Number(item.precoVenda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => setModalMov(item)} className="btn-ghost p-1.5" title="Movimentar">
                    <ArrowUp size={13} className="text-esmeralda-600" />
                  </button>
                  <button onClick={() => setModalItem(item)} className="btn-ghost p-1.5" title="Editar">
                    <Edit2 size={13} className="text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalItem !== null && (
        <ModalItem
          item={modalItem?.id ? modalItem : null}
          onClose={() => setModalItem(null)}
          onSalvo={() => { setModalItem(null); carregar() }}
        />
      )}
      {modalMov && (
        <ModalMovimentar
          item={modalMov}
          onClose={() => setModalMov(null)}
          onSalvo={() => { setModalMov(null); carregar() }}
        />
      )}
    </div>
  )
}