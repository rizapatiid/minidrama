const BASE_URL = 'https://dramabos.asia/api/dramabox/api'

const fetchWithRetry = async (url, options = {}, retries = 3) => {
    try {
        const res = await fetch(url, options)
        if (res.status === 429 && retries > 0) {
            await new Promise(r => setTimeout(r, 1500))
            return fetchWithRetry(url, options, retries - 1)
        }
        return res
    } catch (e) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, 1500))
            return fetchWithRetry(url, options, retries - 1)
        }
        throw e
    }
}

export const getDramaBosForYou = async (page = 1) => {
    try {
        const res = await fetchWithRetry(`${BASE_URL}/foryou/${page}?lang=in`)
        if (res.ok) {
            const json = await res.json()
            return json.success ? json.data.list : []
        }
        return []
    } catch (e) {
        console.error("DramaBos ForYou Error", e)
        return []
    }
}

export const getDramaBosNew = async (page = 1) => {
    try {
        const res = await fetchWithRetry(`${BASE_URL}/new/${page}?lang=in`)
        if (res.ok) {
            const json = await res.json()
            return json.success ? json.data.list : []
        }
        return []
    } catch (e) {
        console.error("DramaBos New Error", e)
        return []
    }
}

export const getDramaBosRank = async (page = 1) => {
    try {
        const res = await fetchWithRetry(`${BASE_URL}/rank/${page}?lang=in`)
        if (res.ok) {
            const json = await res.json()
            return json.success ? json.data.list : []
        }
        return []
    } catch (e) {
        console.error("DramaBos Rank Error", e)
        return []
    }
}

export const getDramaBosSearch = async (keyword, page = 1) => {
    try {
        const res = await fetchWithRetry(`${BASE_URL}/search/${encodeURIComponent(keyword)}/${page}?lang=in`)
        if (res.ok) {
            const json = await res.json()
            return json.success ? json.data.list : []
        }
        return []
    } catch (e) {
        console.error("DramaBos Search Error", e)
        return []
    }
}

export const getDramaBosDetail = async (bookId) => {
    try {
        const res = await fetchWithRetry(`${BASE_URL}/drama/${bookId}?lang=in`)
        if (res.ok) {
            const json = await res.json()
            return json.success ? json.data : null
        }
        return null
    } catch (e) {
        console.error("DramaBos Detail Error", e)
        return null
    }
}

export const getDramaBosChapters = async (bookId) => {
    try {
        const res = await fetchWithRetry(`${BASE_URL}/chapters/${bookId}?lang=in`)
        if (res.ok) {
            const json = await res.json()
            // Typically returns a list of chapters
            return json.success ? json.data.chapterList : []
        }
        return []
    } catch (e) {
        console.error("DramaBos Chapters Error", e)
        return []
    }
}

export const getDramaBosStream = async (bookId, index) => {
    try {
        const url = `${BASE_URL}/watch/player?bookId=${bookId}&index=${index}&lang=in`
        console.log("[Dramabos API] Fetching Stream:", url, { bookId, index })

        const res = await fetchWithRetry(url)
        if (res.ok) {
            const json = await res.json()
            if (json.success && json.data) {
                // Priority 1: Direct videoUrl
                if (json.data.videoUrl) return json.data.videoUrl

                // Priority 2: Extract from qualities
                if (json.data.qualities && Array.isArray(json.data.qualities)) {
                    const qs = json.data.qualities

                    // 1. Try 1080p
                    const q1080 = qs.find(q => q.quality === 1080)
                    if (q1080 && q1080.videoPath) return q1080.videoPath

                    // 2. Try 720p
                    const q720 = qs.find(q => q.quality === 720)
                    if (q720 && q720.videoPath) return q720.videoPath

                    // 3. Fallback to Default or First
                    const qDefault = qs.find(q => q.isDefault) || qs[0]
                    if (qDefault && qDefault.videoPath) return qDefault.videoPath
                }
            }
        } else {
            console.error("[Dramabos API] Fetch failed:", res.status, res.statusText)
        }
        return null
    } catch (e) {
        console.error("DramaBos Stream Error", e)
        return null
    }
}
