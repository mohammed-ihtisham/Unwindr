---
timestamp: 'Fri Oct 17 2025 16:40:23 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_164023.7c4bda8f.md]]'
content_id: fa285e2d6f6cff1b00906b61dbbc34cb517a60a036ed826e62c01cc51a24c173
---

# file: deno.json

```json
{
    "imports": {
        "@concepts/": "./src/concepts/",
        "@utils/": "./src/utils/"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api",
        "test": "deno test --allow-read --allow-env --allow-net --allow-sys",
        "test:user": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/UserAuth/UserAuthConcept.test.ts",
       "test:place": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts",
        "test:media-library": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/MediaLibrary/MediaLibrary.test.ts",
        "test:likert": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/LikertSurvey/LikertSurveyConcept.test.ts"
    }
}
```
