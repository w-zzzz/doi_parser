
/**
 * Queries Crossref API to find a DOI for a bibliographic reference.
 * 
 * @param {string} referenceText 
 * @param {string} email (optional) for polite pool
 * @returns {Promise<{found: boolean, doi?: string, score?: number, title?: string}>}
 */
export async function resolveDOI(referenceText, email = 'agent@example.com') {
    try {
        const url = new URL('https://api.crossref.org/works');
        url.searchParams.append('query.bibliographic', referenceText);
        url.searchParams.append('rows', '1'); // We only want the top match

        // Add mailto if provided for polite pool
        if (email) {
            url.searchParams.append('mailto', email);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'User-Agent': `DOI-Discovery-App/1.0 (mailto:${email})`
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const items = data.message?.items;

        if (items && items.length > 0) {
            const bestMatch = items[0];
            // We could check score, but Crossref scores are relative. 
            // Usually the first result is the best guess.
            return {
                found: true,
                doi: bestMatch.DOI,
                score: bestMatch.score,
                title: bestMatch.title ? bestMatch.title[0] : 'Unknown Title'
            };
        }

        return { found: false };

    } catch (error) {
        console.error("Error resolving DOI:", error);
        return { found: false, error: error.message };
    }
}
