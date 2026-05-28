import { useState, useEffect, useCallback } from 'react';

export function usePagination<T>(
  items: T[],
  pageSize: number = 20
): {
  visible: T[];
  loadMore: () => void;
  canLoadMore: boolean;
  reset: () => void;
} {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const loadMore = useCallback(() => {
    setVisibleCount(c => c + pageSize);
  }, [pageSize]);

  const reset = useCallback(() => {
    setVisibleCount(pageSize);
  }, [pageSize]);

  return {
    visible: items.slice(0, visibleCount),
    loadMore,
    canLoadMore: items.length > visibleCount,
    reset,
  };
}
