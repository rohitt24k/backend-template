export type paginationDto = {
  page: number;
  limit: number;
  search?: string;
}

export const defaultPagination: paginationDto = {
  page: 1,
  limit: 10,
  search: "",
};