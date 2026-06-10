import crypto from 'crypto'

const serviceAccountEmail = "live-meet-api@gen-lang-client-0190297063.iam.gserviceaccount.com"
const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCcoKgvyJwmXV84\n1ctYAr7xXQW/8wUefeoZqtPEUCfpbTTc+dtmMLuZ32d7SvILIytCGrWjdEG+mkJY\nF+QwXKc1O1uwq0shrdf+fgkwK1adbRDqHE5AuUFa7w0ReAAfrdU9yN62MjJJFDO8\nUfJD0TJXzFqEa9zMMgysDT/VRSSRy2zckLODtw3PCOQz0xYaHS+WmO2kXjEYv7bA\nV3XQuLeKa2pN8AE9i24OnOVE7ckpZ+S+2hRHf3WnQDPsd9NrQRQQaDmSd50IRdi9\nQ24jmiIjNnc6SSJfD/yIa6il3+PD4MnEtGcAquAJPkbGuQLanKVmheZRae1bV6Lp\n0435NLz9AgMBAAECggEABEF+SGwaSBWV6oiuoYnTj+Hf798F1tYDiCaC4gzuhLJ1\nswJsAnsVAeGW4XwAFyrhuEZbBKG6TphI8LVXezPtTC48d9CztirP2WepzsACtrzZ\nro7N1obiHnsr3vtkf3fc+TSNzqQPBzrQDBAq9cpHpKiWFg6LPZYnj349q4kZLQfv\n3y2oshcEz+oceYL9XDrlg3sJVsRqZjpk5SigzwBoQUl3ANY6KF6t30kw2atKoD3H\nIKGjLHAX561Hclt7AUYd0VuUFy+MBhz0k94tdoGUrYEFXearNWsBGxiVl0mqES/K\nzhPKGy6QVQhMYVyIXqpcv6SgpsMsv6F8xMy4NoS1cQKBgQDMcP9vyq07PmPUIvzY\nC+0EAPYqdB8Zi67OT2rxDilrJvEIaDmyR7pmQB6UWHaB/37yJ2mz9XzvTRv/U4hk\nZ7SRyjrBDAIaN/vI29+aYFFFXpEO+tB8VC9/XPv4oEwVhrOvHPYjYHWQayTxN1Kp\nAOEdTAeH6PDabG/LAexrJrtp8QKBgQDEILxyTRR5jStsDeUan34EWxUc/pzfCGfU\nMwgycF6+HEkRKzkFzv0qdSx2Gw9C6wdoWAC9LaLgF1au6tEewmiFFMZwQctE+VXu\nRB27lbTfDl3C+LNSnQzDdCa9FhvlHkCMfubixZjmAySq92Lwe23FIPHWWvwJlLLP\nfZgjZiBXzQKBgEvo0Q+jQ7sxqUOFUjiuBO1tpfmRcFK96MQ1/NFQntRoeyrR+EpY\nE8APossWJbqTMYGcXMUzK5Z3HSQq0gPl9cgEPNidKtKtYtHrwhTCGqsVN+tF+c+Q\nOqqhzfU9H8MGZwVoTYRJNp3PCsJ99jVGXE/SgSFXvsZ7aO8J4czPbtshAoGAWXAM\nP5uC4MNNr+LOPUvKLbZTdHtvkg3FO3FiJY40xkEj2N57DHkN3hS9B8bjOMLxB9ZJ\nz/tFsSczcmTGpF5HR5jnvT1jsrp5Q0RwwqBMcQOeIlFDhUL1FRScrdGtOtiG2wrr\nwzIUvZ9lU0mpJr1Cm4igf/3RvZS/zfsaK9pgmWkCgYA4Rcm3mkz3uBcOPE8fjw6B\nJ9FDR7sc/KL2Q4ly5Srzo+oS9VpW53NyFY0E3O1FzIEuUmcgoPaAWGMRMERAENkq\nxRkBBDybPf5BqZLMdeszE+u8iFkpKafJ06h4gaKSkOM2eAQltjtcq5svy3gC+xG1\nBfBH6KaFT5kCH4FPMomzLw==\n-----END PRIVATE KEY-----\n"
const calendarId = "48c625fb0e08e1cf5b200df4f95f310d019911c018b83ae5b258d11966e4ca83@group.calendar.google.com"

async function getGoogleAccessToken(email, key) {
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const claim = {
    iss: email,
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
  const signature = signer.sign(key.replace(/\\n/g, '\n'), 'base64url')

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

async function run() {
  try {
    const token = await getGoogleAccessToken(serviceAccountEmail, privateKey)
    console.log('Dumping all events from calendar:', calendarId)

    const listRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    )

    if (!listRes.ok) {
      throw new Error(await listRes.text())
    }

    const data = await listRes.json()
    const events = data.items || []
    console.log(`Fetched ${events.length} total events.\n`)

    for (let i = 0; i < events.length; i++) {
      const e = events[i]
      console.log(`[Event ${i+1}]`)
      console.log(`- Title: "${e.summary}"`)
      console.log(`- ID: ${e.id}`)
      console.log(`- Start: ${e.start?.dateTime || e.start?.date}`)
      console.log(`- HangoutLink: ${e.hangoutLink}`)
      console.log(`- Location: ${e.location}`)
      console.log(`- Description: ${e.description}`)
      console.log(`- ConferenceData: ${JSON.stringify(e.conferenceData)}`)
      console.log('-------------------------------------------')
    }
  } catch (err) {
    console.error('Error:', err.message)
  }
}

run()
