import type { PageEnvelope, PageParams } from '@/api/patrol/types';

export interface PatrolPaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export const createPatrolPagination = (pageSize = 20): PatrolPaginationState => ({
  page: 1,
  pageSize,
  total: 0
});

export const toPageParams = (state: PatrolPaginationState): PageParams => ({
  page: state.page,
  pageSize: state.pageSize
});

export const readPageItems = <T>(payload: PageEnvelope<T> | T[], state: PatrolPaginationState): T[] => {
  if (Array.isArray(payload)) {
    state.total = payload.length;
    return payload;
  }
  state.page = payload.page;
  state.pageSize = payload.pageSize;
  state.total = payload.total;
  return payload.items || [];
};
