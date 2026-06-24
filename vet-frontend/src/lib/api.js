const BASE = 'https://vet-clinic-production-1c6f.up.railway.app'

function getToken() {
  return localStorage.getItem('vet_token')
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    localStorage.removeItem('vet_token')
    localStorage.removeItem('vet_user')
    window.location.href = '/login'
    return
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.error ?? `Erro ${res.status}`)
  }

  return data
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  patch:  (path, body) => request('PATCH',  path, body),
  delete: (path)       => request('DELETE', path),
}

export async function abrirPDF(path) {
  const token = getToken()

  const res = await fetch(`${BASE}${path}`, {  // usa o mesmo BASE do topo
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Erro ao gerar PDF')
  }

  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')

  if (win) {
    win.onload = () => URL.revokeObjectURL(url)
  } else {
    // popup bloqueado — faz download direto
    const a = document.createElement('a')
    a.href = url
    a.download = path.split('/').pop() + '.pdf'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}