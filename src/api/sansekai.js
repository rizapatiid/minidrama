const API = 'https://api.sansekai.my.id/api'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Simple Cache Implementation
const getCachedData = (key) => {
    try {
        const item = localStorage.getItem(key)
        if (!item) return null
        const { data, timestamp } = JSON.parse(item)
        const ONE_HOUR = 60 * 60 * 1000
        if (Date.now() - timestamp > ONE_HOUR) return null
        return data
    } catch {
        return null
    }
}

const setCachedData = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify({
            data,
            timestamp: Date.now()
        }))
    } catch (e) {
        console.warn('LocalStorage full or unavailable', e)
    }
}

// Fetch with Retry Logic
const fetchWithRetry = async (url, options = {}, retries = 3) => {
    try {
        const res = await fetch(url, options)
        if (res.status === 429 && retries > 0) {
            await sleep(1500) // Wait 1.5s before retry
            return fetchWithRetry(url, options, retries - 1)
        }
        return res
    } catch (e) {
        if (retries > 0) {
            await sleep(1500)
            return fetchWithRetry(url, options, retries - 1)
        }
        throw e
    }
}

const fetchWithCache = async (endpoint, cacheKey) => {
    const cached = getCachedData(cacheKey)
    try {
        const res = await fetchWithRetry(`${API}${endpoint}`)
        if (res.ok) {
            const data = await res.json()
            setCachedData(cacheKey, data)
            return data
        }
        if (cached) return cached
        return []
    } catch (e) {
        if (cached) return cached
        return []
    }
}

// Helper to merge lists unique by id
const uniqueBy = (arr, key) => {
    const seen = new Set()
    return arr.filter(item => {
        const id = item[key]
        if (seen.has(id)) return false
        seen.add(id)
        return true
    })
}

export const getDramaBoxLatest = async () => {
    const cacheKey = 'dramabox-latest-v1'
    const cached = getCachedData(cacheKey)
    try {
        const res = await fetchWithRetry(`${API}/dramabox/latest`)
        if (res.ok) {
            const json = await res.json()
            const list = Array.isArray(json) ? json.map(item => ({
                ...item,
                title: item.bookName,
                cover: item.coverWap
            })) : []
            setCachedData(cacheKey, list)
            return list
        }
        if (cached) return cached
        return []
    } catch {
        if (cached) return cached
        return []
    }
}

export const getDramaBoxTrending = async () => {
    const cacheKey = 'dramabox-trending-v1'
    const cached = getCachedData(cacheKey)
    try {
        const res = await fetchWithRetry(`${API}/dramabox/trending`)
        if (res.ok) {
            const json = await res.json()
            const list = Array.isArray(json) ? json.map(item => ({
                ...item,
                title: item.bookName,
                cover: item.coverWap
            })) : []
            setCachedData(cacheKey, list)
            return list
        }
        if (cached) return cached
        return []
    } catch {
        if (cached) return cached
        return []
    }
}

export const getDramaBoxDubIndo = async () => {
    const cacheKey = 'dramabox-dubindo-v1'
    const cached = getCachedData(cacheKey)
    try {
        const res = await fetchWithRetry(`${API}/dramabox/dubindo`)
        if (res.ok) {
            const json = await res.json()
            const list = Array.isArray(json) ? json.map(item => ({
                ...item,
                title: item.bookName,
                cover: item.coverWap
            })) : []
            setCachedData(cacheKey, list)
            return list
        }
        if (cached) return cached
        return []
    } catch {
        if (cached) return cached
        return []
    }
}

export const getDramaBoxVIP = async () => {
    const cacheKey = 'dramabox-vip-v1'
    const cached = getCachedData(cacheKey)
    try {
        const res = await fetchWithRetry(`${API}/dramabox/vip`)
        if (res.ok) {
            const json = await res.json()
            const list = Array.isArray(json) ? json.map(item => ({
                ...item,
                title: item.bookName,
                cover: item.coverWap
            })) : []
            setCachedData(cacheKey, list)
            return list
        }
        if (cached) return cached
        return []
    } catch {
        if (cached) return cached
        return []
    }
}

export const getDramaBoxForYou = async () => {
    const cacheKey = 'dramabox-foryou-v1'
    const cached = getCachedData(cacheKey)
    try {
        const res = await fetchWithRetry(`${API}/dramabox/foryou`)
        if (res.ok) {
            const json = await res.json()
            const list = Array.isArray(json) ? json.map(item => ({
                ...item,
                title: item.bookName,
                cover: item.coverWap
            })) : []
            setCachedData(cacheKey, list)
            return list
        }
        if (cached) return cached
        return []
    } catch {
        if (cached) return cached
        return []
    }
}

export const getDramaBoxRandom = async () => {
    try {
        const res = await fetchWithRetry(`${API}/dramabox/randomdrama`)
        if (res.ok) {
            const json = await res.json()
            return Array.isArray(json) ? json.map(item => ({
                ...item,
                title: item.bookName,
                cover: item.bookCover
            })) : []
        }
        return []
    } catch {
        return []
    }
}

// Composite function for backward compatibility or general fetching
export const getDramaBox = async () => {
    try {
        const [latest, random] = await Promise.all([
            getDramaBoxLatest(),
            getDramaBoxRandom()
        ])
        const combined = [...latest, ...random]
        return uniqueBy(combined, 'bookId')
    } catch {
        return []
    }
}

export const getFlickLatest = async () => {
    const cacheKey = 'flickreels-cache-v1'
    const cached = getCachedData(cacheKey)
    try {
        const res = await fetchWithRetry(`${API}/flickreels/latest`)
        if (res.ok) {
            const json = await res.json()
            const list = json.data?.[0]?.list || []
            setCachedData(cacheKey, list)
            return list
        }
        if (cached) return cached
        return []
    } catch {
        if (cached) return cached
        return []
    }
}

export const getNetShort = async () => {
    const cacheKey = 'netshort-categories-v1'
    const cached = getCachedData(cacheKey)
    try {
        const res = await fetchWithRetry(`${API}/netshort/theaters`)
        if (res.ok) {
            const data = await res.json()
            setCachedData(cacheKey, data)
            return data
        }
        if (cached) return cached
        return []
    } catch {
        if (cached) return cached
        return []
    }
}

export const getNetShortEpisodes = async (id) => {
    try {
        const res = await fetchWithRetry(`${API}/netshort/allepisode?shortPlayId=${id}`)
        if (res.ok) {
            const data = await res.json()
            return data.shortPlayEpisodeInfos || []
        }
        return []
    } catch {
        return []
    }
}

export const getMelolo = async () => {
    const cacheKey = 'melolo-cache-v1'
    const cached = getCachedData(cacheKey)
    try {
        const res = await fetchWithRetry(`${API}/melolo/latest`)
        if (res.ok) {
            const json = await res.json()
            const list = json.books || []
            const mapped = list.map(item => ({
                ...item,
                title: item.book_name,
                introduction: item.abstract,
                tags: item.tags,
                // Fix HEIC images by using weserv.nl proxy
                cover: item.thumb_url ? `https://images.weserv.nl/?url=${encodeURIComponent(item.thumb_url)}&output=jpg` : item.thumb_url
            }))
            setCachedData(cacheKey, mapped)
            return mapped
        }
        if (cached) return cached
        return []
    } catch {
        if (cached) return cached
        return []
    }
}

export const getItemById = async (source, id) => {
    try {
        // Force refresh if cache missing? No, assume Home loaded it.
        const keyMap = {
            'dramabox': 'dramabox-cache-mixed-v1',
            'flickreels': 'flickreels-cache-v1',
            'melolo': 'melolo-cache-v1',
            'netshort': 'netshort-categories-v1'
        }

        const cacheKey = keyMap[source]
        const cached = getCachedData(cacheKey)

        if (!cached) return null

        // NetShort is nested
        if (source === 'netshort') {
            const all = cached.flatMap(cat => cat.contentInfos || [])
            return all.find(item => String(item.shortPlayId) === String(id))
        }

        // Others are flat lists (DramaBox, Melolo) or wrapped (Flick)
        const list = Array.isArray(cached) ? cached : (cached.books || [])

        // Find by various ID fields
        return list.find(item =>
            String(item.bookId) === String(id) ||
            String(item.playlet_id) === String(id) ||
            String(item.book_id) === String(id) ||
            String(item.shortPlayId) === String(id)
        )
    } catch (e) {
        console.error("Error finding item", e)
        return null
    }
}
