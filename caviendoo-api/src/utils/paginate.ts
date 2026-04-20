export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export function buildSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
