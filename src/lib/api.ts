const AUTH_URL = 'https://functions.poehali.dev/be74786c-a9f9-457d-a174-be96c952354e'
const CATALOG_URL = 'https://functions.poehali.dev/5054db99-99b8-4d43-84f2-b8a136e47dc5'
const ORDERS_URL = 'https://functions.poehali.dev/aceea045-9087-4f41-8120-bd74f2063f6e'

export const getToken = () => localStorage.getItem('auth_token') || ''
export const setToken = (t: string) => localStorage.setItem('auth_token', t)
export const clearToken = () => localStorage.removeItem('auth_token')

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Auth-Token': getToken(),
})

const get = (url: string) => fetch(url, { headers: { 'X-Auth-Token': getToken() } }).then(r => r.json())
const post = (url: string, data?: unknown) => fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data ?? {}) }).then(r => r.json())
const put = (url: string, data: unknown) => fetch(url, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(r => r.json())

export const api = {
  auth: {
    register: (data: { nickname: string; email: string; phone: string; password: string }) =>
      post(`${AUTH_URL}/register`, data),

    login: (data: { email: string; password: string }) =>
      post(`${AUTH_URL}/login`, data),

    logout: () =>
      post(`${AUTH_URL}/logout`),

    me: () =>
      get(`${AUTH_URL}/me`),
  },

  catalog: {
    list: (sort?: string) =>
      fetch(`${CATALOG_URL}/${sort ? '?sort=' + sort : ''}`).then(r => r.json()),

    product: (id: number) =>
      fetch(`${CATALOG_URL}/${id}`).then(r => r.json()),

    atomizers: () =>
      fetch(`${CATALOG_URL}/atomizers`).then(r => r.json()),

    update: (id: number, data: Record<string, unknown>) =>
      put(`${CATALOG_URL}/${id}`, data),

    create: (data: Record<string, unknown>) =>
      post(`${CATALOG_URL}/`, data),
  },

  orders: {
    place: (data: { product_id: number; volume_ml: number }) =>
      post(`${ORDERS_URL}/place`, data),

    my: () =>
      get(`${ORDERS_URL}/my`),

    delete: (order_id: number) =>
      post(`${ORDERS_URL}/delete`, { order_id }),

    archive: (order_id: number) =>
      post(`${ORDERS_URL}/archive`, { order_id }),

    pay: (data: { order_id: number; payment_amount: number; payment_note: string }) =>
      post(`${ORDERS_URL}/pay`, data),

    pickup: (order_id: number, pickup_point: string) =>
      post(`${ORDERS_URL}/pickup`, { order_id, pickup_point }),
  },
}
