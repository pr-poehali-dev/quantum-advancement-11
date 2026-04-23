const AUTH_URL = 'https://functions.poehali.dev/be74786c-a9f9-457d-a174-be96c952354e'
const CATALOG_URL = 'https://functions.poehali.dev/5054db99-99b8-4d43-84f2-b8a136e47dc5'
const ORDERS_URL = 'https://functions.poehali.dev/aceea045-9087-4f41-8120-bd74f2063f6e'
const ADMIN_URL = 'https://functions.poehali.dev/029f6170-ce3b-4284-acff-07d6c3c33519'
const MESSAGES_URL = 'https://functions.poehali.dev/1f46aa84-5bd4-48b5-b35f-5d08262ca926'

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
    list: (sort?: string, category?: string) => {
      const p = new URLSearchParams({ action: 'list' })
      if (sort) p.set('sort', sort)
      if (category) p.set('category', category)
      return fetch(`${CATALOG_URL}/?${p.toString()}`).then(r => r.json())
    },
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
    pay: (data: { order_ids?: number[]; order_id?: number; payment_amount: number; payment_note: string; payment_date?: string }) =>
      post(`${ORDERS_URL}/`, { action: 'pay', ...data }),
    pickup: (order_id: number, pickup_point: string) =>
      post(`${ORDERS_URL}/`, { action: 'pickup', order_id, pickup_point }),
    myDebts: () =>
      get(`${ORDERS_URL}/?action=my_debts`),
    deliveryOptions: () =>
      get(`${ORDERS_URL}/?action=delivery_options`),
    setDelivery: (data: { order_ids: number[]; delivery_option_id: number; delivery_comment?: string }) =>
      post(`${ORDERS_URL}/`, { action: 'set_delivery', ...data }),
    debtRequest: (data: { debt_id: number; request_type: 'refund' | 'credit'; card?: string }) =>
      post(`${ORDERS_URL}/`, { action: 'debt_request', ...data }),
  },

  admin: {
    orders: (filters: { nick?: string; product?: string; status?: string; delivery?: string }) => {
      const p = new URLSearchParams({ action: 'orders' })
      if (filters.nick) p.set('nick', filters.nick)
      if (filters.product) p.set('product', filters.product)
      if (filters.status) p.set('status', filters.status)
      if (filters.delivery) p.set('delivery', filters.delivery)
      return get(`${ADMIN_URL}/?${p.toString()}`)
    },
    setStatus: (order_ids: number[], status: string) =>
      post(`${ADMIN_URL}/`, { action: 'set_status', order_ids, status }),
    confirmPayment: (order_id: number, confirmed_amount: number, debt_note?: string) =>
      post(`${ADMIN_URL}/`, { action: 'confirm_payment', order_id, confirmed_amount, debt_note }),
    payments: () =>
      get(`${ADMIN_URL}/?action=payments`),
    confirmedPayments: () =>
      get(`${ADMIN_URL}/?action=confirmed_payments`),
    editPayment: (order_id: number, data: { payment_amount?: number; payment_date?: string; payment_note?: string; payment_confirmed_amount?: number }) =>
      post(`${ADMIN_URL}/`, { action: 'edit_payment', order_id, ...data }),
    debts: () =>
      get(`${ADMIN_URL}/?action=debts`),
    addDebt: (data: { user_id: number; type: 'client_owes' | 'we_owe'; amount: number; reason: string; order_id?: number }) =>
      post(`${ADMIN_URL}/`, { action: 'add_debt', ...data }),
    resolveDebt: (debt_id: number, resolve_note: string) =>
      post(`${ADMIN_URL}/`, { action: 'resolve_debt', debt_id, resolve_note }),
    archiveOrder: (order_id: number) =>
      post(`${ADMIN_URL}/`, { action: 'archive_order', order_id }),
    archiveOrders: (order_ids: number[]) =>
      post(`${ADMIN_URL}/`, { action: 'archive_orders', order_ids }),
    archivedOrders: (filters: { nick?: string; product?: string }) => {
      const p = new URLSearchParams({ action: 'archived_orders' })
      if (filters.nick) p.set('nick', filters.nick)
      if (filters.product) p.set('product', filters.product)
      return get(`${ADMIN_URL}/?${p.toString()}`)
    },
    unarchiveOrders: (order_ids: number[]) =>
      post(`${ADMIN_URL}/`, { action: 'unarchive_orders', order_ids }),
    adminProducts: (filters: { name?: string; brand?: string; sort?: string; dir?: string }) => {
      const p = new URLSearchParams({ action: 'admin_products' })
      if (filters.name) p.set('name', filters.name)
      if (filters.brand) p.set('brand', filters.brand)
      if (filters.sort) p.set('sort', filters.sort)
      if (filters.dir) p.set('dir', filters.dir)
      return get(`${ADMIN_URL}/?${p.toString()}`)
    },
    updateProduct: (data: Record<string, unknown>) =>
      post(`${ADMIN_URL}/`, { action: 'update_product', ...data }),
    importProducts: (items: Record<string, unknown>[]) =>
      post(`${ADMIN_URL}/`, { action: 'import_products', items }),
    users: (q?: string) => get(`${ADMIN_URL}/?action=users${q ? '&q=' + encodeURIComponent(q) : ''}`),
    updateUser: (data: Record<string, unknown>) => post(`${ADMIN_URL}/`, { action: 'update_user', ...data }),
    blockUser: (user_id: number, is_blocked: boolean, reason?: string) =>
      post(`${ADMIN_URL}/`, { action: 'block_user', user_id, is_blocked, reason }),
    getDeliveryOptions: () =>
      get(`${ADMIN_URL}/?action=get_delivery_options`),
    createDeliveryOption: (data: { name: string; description?: string | null; address?: string | null; schedule?: string | null; sort_order?: number }) =>
      post(`${ADMIN_URL}/`, { action: 'create_delivery_option', ...data }),
    updateDeliveryOption: (id: number, data: Record<string, unknown>) =>
      post(`${ADMIN_URL}/`, { action: 'update_delivery_option', id, ...data }),
    deleteDeliveryOption: (id: number) =>
      post(`${ADMIN_URL}/`, { action: 'delete_delivery_option', id }),
  },

  messages: {
    inbox: () => get(`${MESSAGES_URL}/?action=inbox`),
    unreadCount: () => get(`${MESSAGES_URL}/?action=unread_count`),
    send: (body: string) => post(`${MESSAGES_URL}/`, { action: 'send', body }),
    adminInbox: () => get(`${MESSAGES_URL}/?action=admin_inbox`),
    thread: (user_id: number) => get(`${MESSAGES_URL}/?action=thread&user_id=${user_id}`),
    reply: (to_user_id: number, body: string) => post(`${MESSAGES_URL}/`, { action: 'reply', to_user_id, body }),
    broadcast: (user_ids: number[], body: string) => post(`${MESSAGES_URL}/`, { action: 'broadcast', user_ids, body }),
  },
}