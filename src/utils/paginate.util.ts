export const Paginate = <T>(
  data: T[],
  limit: number,
  page: number,
  total: number,
) => ({
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
});
