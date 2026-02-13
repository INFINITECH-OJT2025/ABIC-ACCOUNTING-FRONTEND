import { useState, useEffect, useCallback } from 'react'
import { adminApi, AdminAccount, CreateAdminRequest, UpdateAdminRequest, ApiResponse } from '@/lib/api/admin'

interface UseAdminAccountsOptions {
  autoFetch?: boolean
  initialFilters?: {
    search?: string
    status?: 'all' | 'Active' | 'Inactive' | 'Suspended'
    dateFrom?: string
    dateTo?: string
  }
}

interface UseAdminAccountsReturn {
  admins: AdminAccount[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  } | null
  
  // Actions
  fetchAdmins: (filters?: {
    search?: string
    status?: 'all' | 'Active' | 'Inactive' | 'Suspended'
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }) => Promise<void>
  
  createAdmin: (data: CreateAdminRequest) => Promise<ApiResponse<AdminAccount>>
  updateAdmin: (id: string, data: UpdateAdminRequest) => Promise<ApiResponse<AdminAccount>>
  deleteAdmin: (id: string) => Promise<ApiResponse<null>>
  checkEmailExists: (email: string, excludeId?: string) => Promise<boolean>
  
  refresh: () => Promise<void>
  clearError: () => void
}

export function useAdminAccounts(options: UseAdminAccountsOptions = {}): UseAdminAccountsReturn {
  const { autoFetch = true, initialFilters = {} } = options

  const [admins, setAdmins] = useState<AdminAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  } | null>(null)
  
  const [currentFilters, setCurrentFilters] = useState(initialFilters)

  const fetchAdmins = useCallback(async (filters?: {
    search?: string
    status?: 'all' | 'Active' | 'Inactive' | 'Suspended'
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const mergedFilters = { ...currentFilters, ...filters }
      setCurrentFilters(mergedFilters)

      const response = await adminApi.getAdmins(mergedFilters)
      
      if (response.success) {
        setAdmins(response.data?.data || [])
        setPagination(response.data?.pagination || null)
      } else {
        setError(response.message)
        setAdmins([])
        setPagination(null)
      }
    } catch (err) {
      setError('Failed to fetch admin accounts')
      setAdmins([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [currentFilters])

  const createAdmin = useCallback(async (data: CreateAdminRequest): Promise<ApiResponse<AdminAccount>> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await adminApi.createAdmin(data)
      
      if (response.success) {
        // Add the new admin to the list
        if (response.data) {
          setAdmins(prev => [response.data!, ...prev])
        }
      } else {
        setError(response.message)
      }
      
      return response
    } catch (err) {
      const errorResponse: ApiResponse<AdminAccount> = {
        success: false,
        message: 'Failed to create admin account',
        errors: undefined
      }
      setError(errorResponse.message)
      return errorResponse
    } finally {
      setLoading(false)
    }
  }, [])

  const updateAdmin = useCallback(async (id: string, data: UpdateAdminRequest): Promise<ApiResponse<AdminAccount>> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await adminApi.updateAdmin(id, data)
      
      if (response.success) {
        // Update the admin in the list
        if (response.data) {
          setAdmins(prev => prev.map(admin => 
            admin.id === id ? response.data! : admin
          ))
        }
      } else {
        setError(response.message)
      }
      
      return response
    } catch (err) {
      const errorResponse: ApiResponse<AdminAccount> = {
        success: false,
        message: 'Failed to update admin account',
        errors: undefined
      }
      setError(errorResponse.message)
      return errorResponse
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteAdmin = useCallback(async (id: string): Promise<ApiResponse<null>> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await adminApi.deleteAdmin(id)
      
      if (response.success) {
        // Remove the admin from the list
        setAdmins(prev => prev.filter(admin => admin.id !== id))
      } else {
        setError(response.message)
      }
      
      return response
    } catch (err) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Failed to delete admin account',
        errors: undefined
      }
      setError(errorResponse.message)
      return errorResponse
    } finally {
      setLoading(false)
    }
  }, [])

  const checkEmailExists = useCallback(async (email: string, excludeId?: string): Promise<boolean> => {
    try {
      const response = await adminApi.checkEmailExists(email, excludeId)
      return response.success ? response.data?.exists || false : false
    } catch (err) {
      console.error('Check email exists error:', err)
      return false
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchAdmins(currentFilters)
  }, [fetchAdmins, currentFilters])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchAdmins(initialFilters)
    }
  }, [autoFetch, fetchAdmins, initialFilters])

  return {
    admins,
    loading,
    error,
    pagination,
    fetchAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    checkEmailExists,
    refresh,
    clearError
  }
}
