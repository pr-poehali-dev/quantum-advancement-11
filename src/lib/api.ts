const AUTH_URL = 'https://functions.poehali.dev/be74786c-a9f9-457d-a174-be96c952354e'
const CATALOG_URL = 'https://functions.poehali.dev/5054db99-99b8-4d43-84f2-b8a136e47dc5'
const ORDERS_URL = 'https://functions.poehali.dev/aceea045-9087-4f41-8120-bd74f2063f6e'

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

    update: (id: number, data: Record<string, unknown>) =>
      fetch(`${CATALOG_URL}/${id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

    create: (data: Record<string, unknown>) =>
      fetch(`${CATALOG_URL}/`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  },

  orders: {
    place: (data: { product_id: number; volume_ml: number }) =>
      fetch(`${ORDERS_URL}/place`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

    my: () =>
      fetch(`${ORDERS_URL}/my`, { credentials: 'include' }).then(r => r.json()),

    delete: (order_id: number) =>
      fetch(`${ORDERS_URL}/delete`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id }) }).then(r => r.json()),

    archive: (order_id: number) =>
      fetch(`${ORDERS_URL}/archive`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id }) }).then(r => r.json()),

    pay: (data: { order_id: number; payment_amount: number; payment_note: string }) =>
      fetch(`${ORDERS_URL}/pay`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

    pickup: (order_id: number, pickup_point: string) =>
      fetch(`${ORDERS_URL}/pickup`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id, pickup_point }) }).then(r => r.json()),
  },
}