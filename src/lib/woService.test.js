import { describe, it, expect, vi, beforeEach } from 'vitest'
import { seedWorkOrders, listWorkOrders } from './woService'
import { supabase } from './supabase'

// Mock Supabase client
vi.mock('./supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            order: vi.fn()
        }))
    }
}))

describe('woService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('seedWorkOrders should clean payloads before inserting', async () => {
        const mockInsert = vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [], error: null }) })
        supabase.from.mockReturnValue({ insert: mockInsert })

        const dirtyData = [
            { id: '123', code: 'BAD', cliente: 'TEST', fechaPlan: '2025-01-01' }
        ]

        await seedWorkOrders(dirtyData)

        expect(mockInsert).toHaveBeenCalledWith([
            // Expect id and code to be removed if your cleanPayload logic removes them
            // Based on current implementation:
            { cliente: 'TEST', fechaPlan: '2025-01-01' }
        ])
    })

    it('listWorkOrders should return empty array on failure if designed so, or throw', async () => {
        const mockOrder = vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } })
        const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
        supabase.from.mockReturnValue({ select: mockSelect })

        await expect(listWorkOrders()).rejects.toThrow('work_orders list failed: Network error')
    })
})
