  import axios from 'axios'

  const api = axios.create({
    baseURL: 'https://barangay-sto-nino-budget-tracker-system-production.up.railway.app/api',
    headers: { 'Content-Type': 'application/json' }
  })

  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  api.interceptors.response.use(
    res => res,
    err => {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }
  )

  export default api

  // Auth
// Auth
  export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data), // Idagdag mo ito!
    me: () => api.get('/auth/me'),
    users: () => api.get('/auth/users'),
  }
  
  // Budget
  export const budgetAPI = {
    categories: () => api.get('/budget/categories'),
    allocations: (year) => api.get('/budget/allocations', { params: { fiscal_year: year } }),
    createAllocation: (data) => api.post('/budget/allocations', data),
    updateAllocation: (id, data) => api.put(`/budget/allocations/${id}`, data),
    summary: (year) => api.get(`/budget/summary/${year}`),
  }

  // Transactions
  export const transactionAPI = {
    list: (params) => api.get('/transactions/', { params }),
    create: (data) => api.post('/transactions/', data),
    approve: (id, data) => api.put(`/transactions/${id}/approve`, data),
    summary: (year) => api.get(`/transactions/summary/${year}`),
  }

  // Reports
  export const reportsAPI = {
    incomeExpense: (year) => api.get(`/reports/income-expense/${year}`),
    categoryBreakdown: (year) => api.get(`/reports/category-breakdown/${year}`),
  }

  // AI Insights
  export const aiAPI = {
    dashboard: (year) => api.get(`/ai/dashboard/${year}`),
    forecast: (year) => api.get(`/ai/forecast/${year}`),
    utilization: (year) => api.get(`/ai/utilization/${year}`),
    anomalies: (year) => api.get(`/ai/anomalies/${year}`),
    recommendations: (year) => api.get(`/ai/recommendations/${year}`),
  }

  // ==========================================
  // BLOCKCHAIN API (Dito ang kulang mo kanina)
  // ==========================================
  export const blockchainAPI = {
    // Aliases para siguradong hindi mag-error ang frontend
    blocks: (limit, offset) => api.get('/blockchain/blocks', { params: { limit, offset } }),
    getBlocks: (limit, offset) => api.get('/blockchain/blocks', { params: { limit, offset } }),
    
    verify: () => api.get('/blockchain/verify'),
    verifyChain: () => api.get('/blockchain/verify'),
    
    stats: () => api.get('/blockchain/stats'),
    getStats: () => api.get('/blockchain/stats'),
  }