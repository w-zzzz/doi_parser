
import https from 'https';

// --- Parser Logic (Copied from src/utils/parser.js) ---
function parseReferences(text) {
    if (!text) return [];
    const parts = text.split(/(\[\d+\])/).filter(p => p.trim().length > 0);
    const references = [];
    let currentRef = null;
    for (const part of parts) {
        if (/^\[\d+\]$/.test(part.trim())) {
            if (currentRef) references.push(currentRef);
            currentRef = { id: part.trim(), text: "" };
        } else if (currentRef) {
            currentRef.text += " " + part.trim();
        }
    }
    if (currentRef) references.push(currentRef);
    return references.map(ref => ({
        id: ref.id,
        text: ref.text.replace(/\s+/g, ' ').trim()
    }));
}

// --- Test Data ---
const testInput = `
[1] J. Hammer and C. J. L. Newth, "Assessment of thoraco-abdominal asyn chrony," Paediatric Respiratory Reviews, vol. 10, no. 2, pp. 75-80, 2009.
[2] P. -H. Huang, W. -C. Chung, C. -C. Sheu, J. -R. Tsai, and T. -C. Hsiao, "Is 
the asynchronous phase of thoracoabdominal movement a novel feature of 
successful extubation? A preliminary result," in 2021 43rd Annual Inter national Conference of the IEEE Engineering in Medicine & Biology So ciety (EMBC), Mexico, pp. 752-756, 2021.
`;

// --- Run Parser ---
console.log("Testing Parser...");
const refs = parseReferences(testInput);
console.log(`Parsed ${refs.length} references.`);
refs.forEach(r => {
    console.log(`ID: ${r.id}`);
    console.log(`Text: ${r.text.substring(0, 50)}...`);
    if (r.text.includes('\n')) console.error("FAILED: Newline found in parsed text");
    else console.log("PASSED: No newlines");
});

// --- Test API (Manual fetch) for Ref [1] ---
const ref1 = refs[0].text;
const encoded = encodeURIComponent(ref1);
const url = `https://api.crossref.org/works?query.bibliographic=${encoded}&rows=1&mailto=agent@example.com`;

console.log("\nTesting API...");
https.get(url, { headers: { 'User-Agent': 'TestScript/1.0 (mailto:agent@example.com)' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const item = json.message.items[0];
            if (item) {
                console.log("API Success. Found DOI:", item.DOI);
                console.log("Title:", item.title); // title is array
            } else {
                console.log("API returned no items.");
            }
        } catch (e) {
            console.error("API Parse Error:", e.message);
        }
    });
}).on('error', (e) => {
    console.error("API Network Error:", e.message);
});
