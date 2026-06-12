// src/lib/apiAuth.js
import {
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  http,
  setAuthSession,
} from "./apiClient";

export { clearAuthSession, getAuthToken, getStoredUser, setAuthSession };

export const authApi = {
  async login(payload) {
    const data = await http("/usuarios/login/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (data?.token && data?.user) {
      setAuthSession({
        token: data.token,
        usuario: data.user,
      });
    }

    return data;
  },

  async registro(payload) {
    return http("/usuarios/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async me() {
    return http("/usuarios/me/", {
      method: "GET",
    });
  },

  logout() {
    clearAuthSession();
  },
};
