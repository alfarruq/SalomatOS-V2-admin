import { useState } from 'react'
import { Button } from './ui'

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button
      aria-label={label}
      className="px-2"
      onClick={() => {
        void navigator.clipboard
          ?.writeText(value)
          .then(() => {
            setDone(true)
            setTimeout(() => setDone(false), 1500)
          })
          .catch(() => undefined)
      }}
    >
      {done ? 'Nusxalandi' : 'Nusxa'}
    </Button>
  )
}

// The password is hidden until asked for, so a screen share or a glance over the shoulder
// does not read every customer's credentials.
export function Password({ value }: { value: string | null }) {
  const [shown, setShown] = useState(false)
  if (value === null) {
    return <span className="text-sm text-text-secondary">Parol ko'rinmaydi (egasi o'zgartirgan yoki berilmagan)</span>
  }
  return (
    <span className="flex items-center gap-2">
      <code className="min-w-[10ch] select-all rounded bg-bg px-2 py-1 text-sm">{shown ? value : '••••••••••'}</code>
      <Button className="px-2" onClick={() => setShown(!shown)}>
        {shown ? 'Yashirish' : "Ko'rsatish"}
      </Button>
      <CopyButton value={value} label="Parolni nusxalash" />
    </span>
  )
}

export function Login({ value }: { value: string }) {
  return (
    <span className="flex items-center gap-2">
      <code className="rounded bg-bg px-2 py-1 text-sm">{value}</code>
      <CopyButton value={value} label="Loginni nusxalash" />
    </span>
  )
}
