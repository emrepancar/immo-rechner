import { describe, it, expect, vi, beforeEach } from 'vitest'
import { client, ApiError } from '../api/client'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }
}

beforeEach(() => mockFetch.mockReset())

describe('ApiError', () => {
  it('carries status code', () => {
    const err = new ApiError('not found', 404)
    expect(err.message).toBe('not found')
    expect(err.status).toBe(404)
    expect(err).toBeInstanceOf(Error)
  })
})

describe('client.get', () => {
  it('returns parsed JSON on success', async () => {
    mockFetch.mockResolvedValue(makeResponse({ id: 1 }))
    const result = await client.get('/api/test')
    expect(result).toEqual({ id: 1 })
  })

  it('throws ApiError on non-2xx', async () => {
    mockFetch.mockResolvedValue(makeResponse({ errors: ['Not found'] }, 404))
    await expect(client.get('/api/missing')).rejects.toThrow(ApiError)
    await expect(client.get('/api/missing')).rejects.toMatchObject({ status: 404 })
  })

  it('uses error message from response body', async () => {
    mockFetch.mockResolvedValue(makeResponse({ errors: ['Custom error'] }, 400))
    await expect(client.get('/api/bad')).rejects.toThrow('Custom error')
  })
})

describe('client.post', () => {
  it('sends JSON body with POST method', async () => {
    mockFetch.mockResolvedValue(makeResponse({ id: 5 }, 201))
    await client.post('/api/items', { name: 'test' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/items'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      }),
    )
  })
})

describe('client.delete', () => {
  it('returns null on 204', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204, json: () => Promise.reject() })
    const result = await client.delete('/api/items/1')
    expect(result).toBeNull()
  })
})
