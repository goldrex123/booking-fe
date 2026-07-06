const ACCESS_TOKEN_COOKIE = "accessToken";

export function setAccessTokenCookie(token: string, expiresIn = 1800) {
  const expires = new Date(Date.now() + expiresIn * 1000).toUTCString();
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${token}; path=/; expires=${expires}; SameSite=Lax`;
}

export function clearAccessTokenCookie() {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0`;
}
