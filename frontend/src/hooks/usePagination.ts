import { useState } from 'react'

interface UsePaginationProps {
  initialPage?: number
  initialLimit?: number
}

export function usePagination({ initialPage = 1, initialLimit = 12 }: UsePaginationProps = {}) {
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)

  return {
    page,
    limit,
    setPage,
    nextPage: () => setPage((p) => p + 1),
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
    reset: () => setPage(1),
  }
}
