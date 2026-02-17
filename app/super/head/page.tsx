"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HeadPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/super/head/admins")
  }, [router])
  return null
}
