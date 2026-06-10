import crypto from 'crypto'

async function getGoogleAccessToken(serviceAccountEmail: string, privateKey: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }
  const now = Math.floor(Date.now() / 1000)
  const claim = {
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url')
  const base64Claim = Buffer.from(JSON.stringify(claim)).toString('base64url')
  const signatureInput = `${base64Header}.${base64Claim}`

  const signer = crypto.createSign('RSA-SHA256')
  signer.update(signatureInput)
  const signature = signer.sign(privateKey, 'base64url')

  const jwt = `${signatureInput}.${signature}`

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    cache: 'no-store',
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to get Google Access Token: ${errText}`)
  }

  const data = await response.json()
  return data.access_token
}

async function getGoogleAccessTokenByRefreshToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }).toString(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to refresh Google Access Token: ${errText}`)
  }

  const data = await response.json()
  return data.access_token
}

function cleanEnvVar(val: string | undefined): string | undefined {
  if (!val) return val
  return val.replace(/^["']|["']$/g, '').trim()
}

function getCalendarId(): string {
  return cleanEnvVar(process.env.GOOGLE_CALENDAR_ID) || 'primary'
}

async function getAccessToken(): Promise<string> {
  const clientId = cleanEnvVar(process.env.GOOGLE_CLIENT_ID)
  const clientSecret = cleanEnvVar(process.env.GOOGLE_CLIENT_SECRET)
  const refreshToken = cleanEnvVar(process.env.GOOGLE_REFRESH_TOKEN)

  if (clientId && clientSecret && refreshToken) {
    return await getGoogleAccessTokenByRefreshToken(clientId, clientSecret, refreshToken)
  }

  const serviceAccountEmail = cleanEnvVar(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)
  const privateKey = cleanEnvVar(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Google Calendar credentials (OAuth or Service Account) are not configured.')
  }

  return await getGoogleAccessToken(serviceAccountEmail, privateKey.replace(/\\n/g, '\n'))
}

export async function inviteVIPStudentToMeet(eventId: string, studentEmail: string) {
  const calendarId = getCalendarId()

  try {
    const token = await getAccessToken()

    // 1. Get current event details
    const getRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    )

    if (!getRes.ok) {
      const errText = await getRes.text()
      throw new Error(`Failed to get event details: ${errText}`)
    }

    const event = await getRes.json()
    const attendees = event.attendees || []

    // Check if student is already in attendees list
    if (attendees.some((a: any) => a.email?.toLowerCase() === studentEmail.toLowerCase())) {
      return // Already invited
    }

    attendees.push({ email: studentEmail })

    // 2. Patch attendees list on the Google Event
    const patchRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendees }),
      }
    )

    if (!patchRes.ok) {
      const errText = await patchRes.text()
      throw new Error(`Failed to update attendees list: ${errText}`)
    }
  } catch (error) {
    console.error('inviteVIPStudentToMeet error:', error)
    throw error
  }
}

export async function findEventIdByMeetUrl(meetUrl: string): Promise<string | null> {
  const calendarId = getCalendarId()

  try {
    const token = await getAccessToken()

    // Extract meet code (10 alphanumeric chars with hyphens, e.g., aru-ikbe-ksc)
    const cleanedUrl = meetUrl.split('?')[0].trim()
    const match = cleanedUrl.match(/meet\.google\.com\/([a-z0-9-]+)/i)
    const code = match ? match[1] : cleanedUrl

    // Fetch upcoming and recent events (starting from 7 days ago) to scan in-memory
    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=250&singleEvents=true`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Failed to list calendar events: ${errText}`)
    }

    const data = await res.json()
    const events = data.items || []

    // Look for exact code match in hangoutLink, entryPoints, location, or description
    for (const event of events) {
      const isMatch = event.hangoutLink?.includes(code) ||
                      event.conferenceData?.entryPoints?.some((ep: any) => ep.uri?.includes(code)) ||
                      event.description?.includes(code) ||
                      event.location?.includes(code)

      if (isMatch) {
        return event.id
      }
    }

    return null
  } catch (error) {
    console.error('findEventIdByMeetUrl error:', error)
    throw error
  }
}

export async function createCalendarEventAndMeet(
  title: string,
  startTime: string,
  endTime: string
): Promise<{ eventId: string; meetUrl: string }> {
  const calendarId = getCalendarId()

  const token = await getAccessToken()

  const body = {
    summary: title,
    start: {
      dateTime: new Date(startTime).toISOString(),
      timeZone: 'Asia/Ho_Chi_Minh',
    },
    end: {
      dateTime: new Date(endTime).toISOString(),
      timeZone: 'Asia/Ho_Chi_Minh',
    },
    conferenceData: {
      createRequest: {
        requestId: `create-meet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    },
  }

  // We must set conferenceDataVersion=1 query parameter to allow conference creation
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to create Google Calendar Event: ${errText}`)
  }

  const data = await response.json()
  const eventId = data.id
  const meetUrl = data.hangoutLink || (data.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri)

  if (!meetUrl) {
    throw new Error('Google Calendar event created, but Google Meet link was not generated.')
  }

  return { eventId, meetUrl }
}


