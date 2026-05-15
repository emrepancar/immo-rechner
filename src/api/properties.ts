import { client } from './client'
import type { Property } from '../types'

export const propertiesApi = {
  getAll:  ()                              => client.get<Property[]>('/api/properties'),
  create:  (data: Omit<Property, 'id'>)   => client.post<Property>('/api/properties', data),
  update:  (id: number, data: Partial<Property>) => client.put<Property>(`/api/properties/${id}`, data),
  remove:  (id: number)                   => client.delete<null>(`/api/properties/${id}`),
}
