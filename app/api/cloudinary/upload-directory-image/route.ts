import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const GENERAL_CONTACTS_KEY = 'general-contacts'
const DIRECTORY_FOLDER_ALIASES: Record<string, string> = {
  sss: 'sss',
  philhealth: 'philhealth',
  tin: 'bir',
  pagibig: 'pagibig',
  [GENERAL_CONTACTS_KEY]: 'general-contacts',
}

const normalizeCode = (value: string): string => String(value || '').trim().toLowerCase()

const getDirectoryFolderPath = (sectionCode: string): string => {
  const normalized = normalizeCode(sectionCode)
  const mapped = DIRECTORY_FOLDER_ALIASES[normalized] || normalized || 'misc'
  return `directory/${mapped}`
}

const buildSignature = (params: Record<string, string>, apiSecret: string): string => {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return crypto.createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ message: 'Cloudinary server credentials are not configured.' }, { status: 500 })
    }

    const body = await request.formData()
    const file = body.get('file')
    const sectionCodeRaw = String(body.get('sectionCode') || '').trim()
    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'A file is required.' }, { status: 400 })
    }
    if (!sectionCodeRaw) {
      return NextResponse.json({ message: 'sectionCode is required.' }, { status: 400 })
    }

    const folder = getDirectoryFolderPath(sectionCodeRaw)
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signatureParams: Record<string, string> = {
      asset_folder: folder,
      folder,
      public_id_prefix: folder,
      timestamp,
      use_asset_folder_as_public_id_prefix: 'true',
    }
    const signature = buildSignature(signatureParams, apiSecret)

    const uploadForm = new FormData()
    uploadForm.set('file', file, file.name || `directory-image-${Date.now()}`)
    uploadForm.set('api_key', apiKey)
    uploadForm.set('timestamp', timestamp)
    uploadForm.set('signature', signature)
    uploadForm.set('folder', folder)
    uploadForm.set('asset_folder', folder)
    uploadForm.set('public_id_prefix', folder)
    uploadForm.set('use_asset_folder_as_public_id_prefix', 'true')

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: uploadForm,
    })

    const payload = await uploadResponse.json()
    if (!uploadResponse.ok) {
      const message = payload?.error?.message || 'Cloudinary upload failed.'
      return NextResponse.json({ message }, { status: uploadResponse.status })
    }

    return NextResponse.json({
      secure_url: payload?.secure_url || '',
      public_id: payload?.public_id || '',
      format: payload?.format || '',
      bytes: Number(payload?.bytes || 0),
    })
  } catch {
    return NextResponse.json({ message: 'Unable to upload directory image.' }, { status: 500 })
  }
}

