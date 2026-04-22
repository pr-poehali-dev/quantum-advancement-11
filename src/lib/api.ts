const AUTH_URL = 'https://functions.poehali.dev/be74786c-a9f9-457d-a174-be96c952354e'
const CATALOG_URL = 'https://functions.poehali.dev/5054db99-99b8-4d43-84f2-b8a136e47dc5'
const ORDERS_URL = 'https://functions.poehali.dev/aceea045-9087-4f41-8120-bd74f2063f6e'
const ADMIN_URL = 'https://functions.poehali.dev/029f6170-ce3b-4284-acff-07d6c3c33519'

export const getToken = () => localStorage.getItem('auth_token') || ''
export const setToken = (t: string) => localStorage.setItem('auth_token', t)
export const clearToken = () => localStorage.removeItem('auth_token')

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Auth-Token': getToken(),
})

const get = (url: string) => fetch(url, { headers: { 'X-Auth-Token': getToken() } }).then(r => r.json())
const post = (url: string, data?: unknown) => fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data ?? {}) }).then(r => r.json())

export const api = {
  auth: {
    register: (data: { nickname: string; email: string; phone: string; password: string }) =>
      post(`${AUTH_URL}/`, { action: 'register', ...data }),

    login: (data: { email: string; password: string }) =>
      post(`${AUTH_URL}/`, { action: 'login', ...data }),

    logout: () =>
      post(`${AUTH_URL}/`, { action: 'logout' }),

    me: () =>
      get(`${AUTH_URL}/?action=me`),
  },

  catalog: {
    list: (sort?: string) =>
      fetch(`${CATALOG_URL}/?action=list${sort ? '&sort=' + sort : ''}`).then(r => r.json()),

    product: (id: number) =>
      fetch(`${CATALOG_URL}/?action=product&id=${id}`).then(r => r.json()),

    atomizers: () =>
      fetch(`${CATALOG_URL}/?action=atomizers`).then(r => r.json()),

    update: (id: number, data: Record<string, unknown>) =>
      post(`${CATALOG_URL}/`, { action: 'update', id, ...data }),

    create: (data: Record<string, unknown>) =>
      post(`${CATALOG_URL}/`, { action: 'create', ...data }),
  },

  orders: {
    place: (data: { product_id: number; volume_ml: number }) =>
      post(`${ORDERS_URL}/`, { action: 'place', ...data }),

    my: () =>
      get(`${ORDERS_URL}/?action=my`),

    delete: (order_id: number) =>
      post(`${ORDERS_URL}/`, { action: 'delete', order_id }),

    archive: (order_id: number) =>
      post(`${ORDERS_URL}/`, { action: 'archive', order_id }),

    pay: (data: { order_id: number; payment_amount: number; payment_note: string }) =>
      post(`${ORDERS_URL}/`, { action: 'pay', ...data }),

    pickup: (order_id: number, pickup_point: string) =>
      post(`${ORDERS_URL}/`, { action: 'pickup', order_id, pickup_point }),
  },

  admin: {
    orders: (filters: { nick?: string; product?: string; status?: string }) => {
      const p = new URLSearchParams({ action: 'orders' })
      if (filters.nick) p.set('nick', filters.nick)
      if (filters.product) p.set('product', filters.product)
      if (filters.status) p.set('status', filters.status)
      return get(`${ADMIN_URL}/?${p.toString()}`)
    },

    setStatus: (order_ids: number[], status: string) =>
      post(`${ADMIN_URL}/`, { action: 'set_status', order_ids, status }),
  },
}