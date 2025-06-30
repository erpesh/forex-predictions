const API_URL = process.env.API_URL

// Gets all active symbols from the API
export async function GET() {
    const res = await fetch(`${API_URL}/currency_pairs`, {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        },
    })
    
    if (!res.ok) {
        throw new Error('Failed to fetch symbols')
    }
    
    const data = await res.json()
    return new Response(JSON.stringify(data), { status: 200 })
}