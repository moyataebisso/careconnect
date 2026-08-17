import 'server-only'
import nodemailer from 'nodemailer'
import { timingSafeEqual } from 'node:crypto'

export const EMAIL_ROUTE_HEADER = 'x-email-route-secret'
const MIN_SECRET_LEN = 32

let cachedTransporter: nodemailer.Transporter | null = null
function getTransporter(): nodemailer.Transporter | null {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null
  if (cachedTransporter) return cachedTransporter
  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  })
  return cachedTransporter
}

// Timing-safe secret check. Fails closed when the env var is missing or too short,
// and returns false for every failure mode (length mismatch, wrong value, missing header).
export function verifyEmailRouteSecret(request: Request): boolean {
  const expected = process.env.EMAIL_ROUTE_SECRET
  if (!expected || expected.length < MIN_SECRET_LEN) return false
  const provided = request.headers.get(EMAIL_ROUTE_HEADER)
  if (!provided) return false
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(provided, 'utf8')
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function escapeHtml(input: unknown): string {
  if (input == null) return ''
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Escape every string field in a shallow record. Non-strings pass through.
export function escapeRecord<T extends Record<string, unknown>>(data: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    out[k] = typeof v === 'string' ? escapeHtml(v) : v
  }
  return out as T
}

// Convert a plain-text body into HTML paragraphs with every character escaped.
export function textToEscapedHtml(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => {
      const withBreaks = paragraph
        .split('\n')
        .map((line) => escapeHtml(line))
        .join('<br>')
      return `<p>${withBreaks}</p>`
    })
    .join('')
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (value.length > 254) return false
  return EMAIL_REGEX.test(value)
}

export const ADMIN_INBOX_EMAIL =
  process.env.ADMIN_INBOX_EMAIL || 'careconnectmkting@gmail.com'
export const EMAIL_FROM = `"CareConnect" <${process.env.EMAIL_USER ?? ''}>`

export type DispatchResult =
  | { ok: true; messageId?: string }
  | { ok: false; reason: 'no_transport' | 'send_failed'; error?: string }

export async function dispatchEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<DispatchResult> {
  const transport = getTransporter()
  if (!transport) {
    console.error('email.dispatcher: EMAIL_USER/EMAIL_PASSWORD not configured')
    return { ok: false, reason: 'no_transport' }
  }
  try {
    const info = await transport.sendMail({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    return { ok: true, messageId: info.messageId }
  } catch (error) {
    console.error('email.dispatcher: sendMail failed', error)
    return {
      ok: false,
      reason: 'send_failed',
      error: error instanceof Error ? error.message : 'unknown',
    }
  }
}
