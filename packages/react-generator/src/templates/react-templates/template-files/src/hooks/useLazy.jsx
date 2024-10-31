import { lazy, Suspense } from 'react'

export const useLazy = (Component) => {
  const Lazy = lazy(() => Component)
  return (props) => (
    <Suspense>
      <Lazy {...props} />
    </Suspense>
  )
}
