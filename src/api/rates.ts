import { client } from './client'
import type { RateOffer } from '../types'

export const ratesApi = {
  getByProperty: (propertyId: number)               => client.get<RateOffer[]>(`/api/zinsangebote?property_id=${propertyId}`),
  create:        (data: Omit<RateOffer, 'id'>)      => client.post<RateOffer>('/api/zinsangebote', data),
  update:        (id: number, data: Partial<RateOffer>) => client.put<RateOffer>(`/api/zinsangebote/${id}`, data),
  remove:        (id: number)                       => client.delete<null>(`/api/zinsangebote/${id}`),
}
