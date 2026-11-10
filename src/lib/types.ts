export type Money = string

export type Billing = {
  currency: string
  install_fee: Money
  install_paid: Money
  install_due: Money
  server_paid_until: string | null
  server_overdue: boolean
  voice_paid_until: string | null
  voice_active: boolean
  sms_credits: number
}

export type Contract = {
  currency: 'USD' | 'UZS'
  install_fee: Money
  server_fee_yearly: Money
  voice_fee_monthly: Money
  voice_enabled: boolean
  voice_monthly_limit: number | null
  signed_on: string | null
  note: string
}

export type Clinic = { id: string; name: string; phone_number: string; address: string; is_active: boolean }
export type Owner = { id: string; username: string; full_name: string; is_active: boolean }

export type OrganizationRow = {
  id: string
  name: string
  is_active: boolean
  clinic_count: number
  billing: Billing
}

export type Organization = OrganizationRow & { contract: Contract; clinics: Clinic[]; owners: Owner[] }

export type Created = { organization: Organization; owner_username: string; owner_temporary_password: string }

export type Usage = {
  clinics: number
  active_clinics: number
  staff: number
  patients: number
  appointments_this_month: number
  procedures_this_month: number
  voice_drafts_this_month: number
  voice_monthly_limit: number
  attachments: number
  attachments_bytes: number
  last_login_at: string | null
}

export type PaymentKind = 'install' | 'server' | 'voice' | 'sms' | 'other'

export type Payment = {
  id: string
  organization: string
  kind: PaymentKind
  amount: Money
  currency: string
  method: string
  paid_on: string
  covers_until: string | null
  sms_credits: number | null
  note: string
  voided_at: string | null
  void_reason: string
}

export type Page<T> = { count: number; results: T[] }

export type Dashboard = {
  organizations: number
  active_organizations: number
  clinics: number
  collected_this_month: { currency: string; kind: string; total: Money }[]
  collected_this_year: { currency: string; kind: string; total: Money }[]
  server_overdue: { id: string; name: string; server_paid_until: string | null }[]
  server_expiring: { id: string; name: string; server_paid_until: string | null }[]
  install_due: { id: string; name: string; currency: string; due: Money }[]
}
