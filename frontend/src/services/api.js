import axios from 'axios'

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

export const fetchManufacturers = () =>
  client.get('/manufacturers/').then(r => r.data)

export const fetchComponents = (params = {}) =>
  client.get('/components/', { params }).then(r => r.data)

/**
 * Validate a multi-channel configuration.
 *
 * @param {Array} channels  Array of channel configs:
 *   { label, amplifier_id, speakers: [{component_id, count}], wiring, bridged }
 */
export const validateConfiguration = (channels) =>
  client.post('/validate/', { channels }).then(r => r.data)

export const fetchSoundcheckInfo = () =>
  client.get('/soundcheck/info').then(r => r.data)
