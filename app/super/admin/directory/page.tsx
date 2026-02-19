"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DirectoryPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/super/admin/directory/process")
  }, [router])
  return null
}
