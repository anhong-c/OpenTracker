export function validatePassword(password: string): boolean {
  return password.length >= 6
}

export function validateUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 20
}
