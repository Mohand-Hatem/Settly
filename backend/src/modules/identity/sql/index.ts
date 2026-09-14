// Raw SQL queries for identity module
export const IDENTITY_QUERIES = {
  findActiveUserCount: "SELECT count(*) FROM \"user\" WHERE banned = false",
};
