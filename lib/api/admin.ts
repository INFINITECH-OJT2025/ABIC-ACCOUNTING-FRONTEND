// API service for admin accounts management

export interface AdminAccount {
  id: string
  name: string
  email: string
  status: 'Active' | 'Inactive' | 'Suspended'
  activatedOn: string
}

export interface CreateAdminRequest {
  name: string
  email: string
}

export interface UpdateAdminRequest {
  name?: string
  email?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export interface AdminListResponse {
  data: AdminAccount[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class AdminApiService {
  private baseUrl = '/api/admin/accounts'

  /**
   * Get all admin accounts with optional filtering
   */
  async getAdmins(params?: {
    search?: string
    status?: 'all' | 'Active' | 'Inactive' | 'Suspended'
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<AdminListResponse>> {
    try {
      const searchParams = new URLSearchParams()
      
      if (params?.search) searchParams.set('search', params.search)
      if (params?.status && params.status !== 'all') searchParams.set('status', params.status)
      if (params?.dateFrom) searchParams.set('date_from', params.dateFrom)
      if (params?.dateTo) searchParams.set('date_to', params.dateTo)
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())

      const url = `${this.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      const response = await fetch(url)
      
      return await response.json()
    } catch (error) {
      console.error('Get admins error:', error)
      return {
        success: false,
        message: 'Failed to fetch admin accounts',
        errors: undefined
      }
    }
  }

  /**
   * Get a single admin account by ID
   */
  async getAdmin(id: string): Promise<ApiResponse<AdminAccount>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)
      return await response.json()
    } catch (error) {
      console.error('Get admin error:', error)
      return {
        success: false,
        message: 'Failed to fetch admin account',
        errors: undefined
      }
    }
  }

  /**
   * Create a new admin account
   */
  async createAdmin(data: CreateAdminRequest): Promise<ApiResponse<AdminAccount>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      return await response.json()
    } catch (error) {
      console.error('Create admin error:', error)
      return {
        success: false,
        message: 'Failed to create admin account',
        errors: undefined
      }
    }
  }

  /**
   * Update an existing admin account
   */
  async updateAdmin(id: string, data: UpdateAdminRequest): Promise<ApiResponse<AdminAccount>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      return await response.json()
    } catch (error) {
      console.error('Update admin error:', error)
      return {
        success: false,
        message: 'Failed to update admin account',
        errors: undefined
      }
    }
  }

  /**
   * Delete an admin account
   */
  async deleteAdmin(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      })
      
      return await response.json()
    } catch (error) {
      console.error('Delete admin error:', error)
      return {
        success: false,
        message: 'Failed to delete admin account',
        errors: undefined
      }
    }
  }

  /**
   * Check if email already exists
   */
  async checkEmailExists(email: string, excludeId?: string): Promise<ApiResponse<{ exists: boolean }>> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.set('check_email', email)
      if (excludeId) searchParams.set('exclude_id', excludeId)

      const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)
      const result = await response.json()
      
      return result
    } catch (error) {
      console.error('Check email error:', error)
      return {
        success: false,
        message: 'Failed to check email availability',
        errors: undefined
      }
    }
  }
}

export const adminApi = new AdminApiService()

// Export types for use in components
export type { AdminApiService }
