[text](../../../context/design/concepts/QualityRanking/QualityRanking.md/steps/_.88da9387.md)

# QualityRanking Concept

concept  QualityRanking [Place]
purpose surface lesser-known places that have high engagement but low mainstream visibility
principle compute a score that promotes well-loved places regardless of popularity,
  helping users discover authentic local favorites

state
  a set of RankingMetrics with
    a placeId Id
    a engagementRatio Number
    a visitorVolume Number
    a qualityScore Number
    a lastUpdated Date

  a set of RankingPreferences with
    a userId Id
    a prefersEmergent Flag
    a radius Number

actions
  
  updateMetrics (placeId: Id, visits: Number, engagement: Number)
    requires place exists and visits >= 0 and engagement >= 0
    effect updates metrics for place

  calculateQualityScore (placeId: Id) : (score: Number)
    requires place exists and has engagement metrics
    effect computes engagement-to-visit ratio
  
  setPreferences (userId: Id, prefersEmergent: Boolean, radius: Number)
    requires user is authenticated and radius > 0
    effect stores ranking preferences
  
  getRecommendedPlaces (userId: Id, centerLat: Number, centerLng: Number) : (places: set Id)
    requires user has ranking preferences and coordinates are valid
    effect returns places within radius ranked by score

## Design Notes

- Quality score = engagement / max(visits, 1) to avoid division by zero
- prefersEmergent flag influences ranking: if true, prioritize lower visitor volume
- Places are filtered by radius before ranking
- Higher quality scores indicate "hidden gems" with good engagement but fewer visitors
- Metrics track both engagement ratio and visitor volume for flexible ranking