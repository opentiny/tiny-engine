import { metaHashMap } from './common'

export const initServices = () => {
  const services = Object.values(metaHashMap).filter((service) => service.type === 'MetaService')

  services.filter((service) => typeof service.init === 'function').forEach((service) => service.init())
  services.filter((service) => typeof service.start === 'function').forEach((service) => service.start())
}
