---
timestamp: 'Fri Oct 17 2025 21:03:01 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_210301.644f657f.md]]'
content_id: 2560a71c9db958667f0682fed2a058cbe3f8cc99200720cb92a958698a6fc12f
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
        "test:media-analytics": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/MediaAnalytics/MediaAnalyticsConcept.test.ts",
        "test:quality-ranking": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/QualityRanking/QualityRankingConcept.test.ts"
    }
}
```
