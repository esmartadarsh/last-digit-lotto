/**
 * Tiny shared token store — breaks the circular dependency between
 * api.js (needs the token) and useAuthStore.js (imports api.js).
 *
 * useAuthStore calls setToken() whenever the token changes.
 * api.js reads getToken() in its request interceptor.
 */
let _token = null;

export const setToken = (t) => { _token = t; };
export const getToken = () => _token;
