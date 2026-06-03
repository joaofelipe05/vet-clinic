// src/lib/api.js
const BASE = '/api'

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
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),

  // URL direta para PDFs (abre em nova aba)
  pdfUrl: (path) => {
    const token = getToken()
    return `${BASE}${path}?token=${token}`
  },
}
