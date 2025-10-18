---
timestamp: 'Fri Oct 17 2025 22:36:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_223636.e04be86d.md]]'
content_id: ccbe34f9b2a4f0c35817efd42d8c0f0e80c90b15c8dae2cda31b78ee228ba07e
---

# Prompt: As we worked on our implementation, some moments are worth recording. For example, we might've discovered that our concept specification was wrong in some way; a test run might expose a subtle bug in a concept implementation; the LLM might generate some code that is unexpectedly good or bad in some way; we might discover a way to simplify our design; and so on. When any such moment arises, we should save a link to the relevant file and place it in our design document. Let's write a cohesive section for this using this highlights:

1. Initially, the way the LLM was generating test cases (i.e. UserAuth) was trying to fit all the test cases under 1 test in Deno, so I had to manually break it into sections cause it wasn't doing a very good job but going forward I realized i good use this as a model template for strucutring for other concepts which worked well.

2. For our LLM-feature concept, interest filter, it was doing a pretty bad job of doing what i wanted it to do, giving mock calls and hardcoding contraditon cases. I tried using files from Assignment 3 as context but it still wasn't the best. I had to kind of just add my files into the code and update as i went.
