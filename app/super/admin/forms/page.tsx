"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FormsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/super/admin/forms/onboarding-checklist")
  }, [router])
  return null
}
