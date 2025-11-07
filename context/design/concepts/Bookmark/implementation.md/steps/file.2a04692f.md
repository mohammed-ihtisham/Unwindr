---
timestamp: 'Fri Nov 07 2025 11:34:02 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_113402.fe980693.md]]'
content_id: 2a04692fc99021687131e9aba7d8cac8d3992dfd033b66534ebfe85512b79b48
---

# file: deno.json

```json
{
    "imports": {
        "@concepts/": "./src/concepts/",
        "@concepts": "./src/concepts/concepts.ts",
        "@test-concepts": "./src/concepts/test_concepts.ts",
        "@utils/": "./src/utils/",
        "@engine": "./src/engine/mod.ts",
        "@syncs": "./src/syncs/syncs.ts",
        "@google/generative-ai": "npm:@google/generative-ai@^0.21.0"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api",
        "test": "deno test --allow-read --allow-env --allow-net --allow-sys",
        "test:user": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/UserAuth/UserAuthConcept.test.ts",
        "test:place": "deno test --allow-read --allow-write --allow-env --allow-net --allow-sys src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts",
        "test:media-library": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/MediaLibrary/MediaLibrary.test.ts",
        "test:likert": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
        "test:media-analytics": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/MediaAnalytics/MediaAnalyticsConcept.test.ts",
        "test:quality-ranking": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/QualityRanking/QualityRankingConcept.test.ts",
        "test:interest-filter": "deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/InterestFilter/InterestFilterConcept.test.ts",
        "import:boston": "deno run --allow-all scripts/import-boston-places.ts",
        "start": "deno run --allow-net --allow-write --allow-read --allow-sys --allow-env src/main.ts",
        "import": "deno run --allow-read --allow-write --allow-env src/utils/generate_imports.ts",
        "build": "deno run import"
    },
    "lint": {
        "rules": {
            "exclude": [
                "no-import-prefix",
                "no-unversioned-import"
            ]
        }
    }
}
```
