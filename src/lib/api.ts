const AUTH_URL = 'https://functions.poehali.dev/be74786c-a9f9-457d-a174-be96c952354e'
const CATALOG_URL = 'https://functions.poehali.dev/5054db99-99b8-4d43-84f2-b8a136e47dc5'

export const api = {
  auth: {
    register: (data: { nickname: string; email: string; phone: string; password: string }) =>
      fetch(`${AUTH_URL}/register`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

    login: (data: { email: string; password: string }) =>
      fetch(`${AUTH_URL}/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

    logout: () =>
      fetch(`${AUTH_URL}/logout`, { method: 'POST', credentials: 'include' }).then(r => r.json()),

    me: () =>
      fetch(`${AUTH_URL}/me`, { credentials: 'include' }).then(r => r.json()),
  },

  catalog: {
    list: (sort?: string) =>
      fetch(`${CATALOG_URL}/${sort ? '?sort=' + sort : ''}`, { credentials: 'include' }).then(r => r.json()),

    product: (id: number) =>
      fetch(`${CATALOG_URL}/${id}`, { credentials: 'include' }).then(r => r.json()),

    atomizers: () =>
      fetch(`${CATALOG_URL}/atomizers`, { credentials: 'include' }).then(r => r.json()),
  },
}
