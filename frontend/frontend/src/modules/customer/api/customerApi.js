const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const API_URL = API_BASE_URL.replace(/\/$/, '')

async function request(path, { token, ...options } = {}) {
  let response

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Backend se connect nahi ho pa raha. Server aur API URL check karein.')
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || `Request failed (${response.status}).`)
    error.status = response.status
    throw error
  }

  return payload
}

export async function sendRegistrationOtp(customer) {
  return request('/customers/register', {
    method: 'POST',
    body: JSON.stringify(customer),
  })
}

export async function verifyRegistrationOtp(customer) {
  return request('/customers/register/verify-otp', {
    method: 'POST',
    body: JSON.stringify(customer),
  })
}

export async function loginCustomer(credentials) {
  return request('/customers/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function sendPasswordResetOtp(MobileNumber) {
  return request('/customers/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ MobileNumber }),
  })
}

export async function resetPasswordWithOtp({ MobileNumber, Otp, NewPassword }) {
  return request('/customers/forgot-password/reset', {
    method: 'POST',
    body: JSON.stringify({ MobileNumber, Otp, NewPassword }),
  })
}

export async function getCustomerProfile(token) {
  return request('/customers/profile', { token })
}

export async function updateCustomerProfile(token, profile) {
  return request('/customers/profile', {
    token,
    method: 'PUT',
    body: JSON.stringify(profile),
  })
}

export async function changeCustomerPassword(token, passwords) {
  return request('/customers/change-password', {
    token,
    method: 'PUT',
    body: JSON.stringify(passwords),
  })
}
