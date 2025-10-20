---
timestamp: 'Sun Oct 19 2025 20:21:24 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_202124.4ff16710.md]]'
content_id: e61b7253c6b146acf610df6dbdc5c4811bf6d296c564631ff731a069865a0f52
---

# file: deno.json

```json
{
    "imports": {
        "@concepts/": "./src/concepts/",
        "@utils/": "./src/utils/",
        "@google/generative-ai": "npm:@google/generative-ai@^0.21.0"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api",
        "test": "deno test --allow-read --allow-env --allow-net --allow-sys",
        "test:user": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/UserAuth/UserAuthConcept.test.ts",
        "test:place": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts",
        "test:media-library": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/MediaLibrary/MediaLibrary.test.ts",
        "test:likert": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
        "test:media-analytics": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/MediaAnalytics/MediaAnalyticsConcept.test.ts",
        "test:quality-ranking": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/QualityRanking/QualityRankingConcept.test.ts",
        "test:interest-filter": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/InterestFilter/InterestFilterConcept.test.ts"
    }
}
```
