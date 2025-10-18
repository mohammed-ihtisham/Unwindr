---
timestamp: 'Fri Oct 17 2025 20:32:06 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_203206.eba31f10.md]]'
content_id: c8de21d3e0238fd4ba4bb9b6107652e87a466db3840930cbbc084a3daa9cd644
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
        "test:likert": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
        "test:media-analytics": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/MediaAnalytics/MediaAnalyticsConcept.test.ts"
    }
}
```
