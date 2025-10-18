## Implementation Highlights and Lessons Learned

As I worked through the implementation phase, there were a lot of moments that taught me something important. Some lessons came from mistakes, others from trial and error, and a few from things that just happened to work out better than expected. Here are the main takeaways and what I learned along the way.

### 1. Getting the LLM to Follow Deno’s Testing Setup

When I first started generating tests for `UserAuth`, I noticed that the LLM wasn’t really following Deno’s testing format or conventions. It kept using patterns that looked more like Node or Jest, and it didn’t handle the `beforeAll` setup function correctly. Things like imports, async setup, and even the order of test blocks were off, which caused small but annoying errors that kept breaking the tests.

As I worked through this, I had to keep fixing the test file structure manually—adjusting imports, moving setup logic into a proper `beforeAll`, and cleaning up how assertions were written. It was repetitive at first, but over time I figured out a cleaner format that actually worked well with Deno’s test runner. Once I got that working, I used it as the main template for all future test files. Now when I generate new ones with the LLM, I make sure to point it to that structure so it stays consistent from the start.

[Inital LLM Tests for UserAuth](../context/design/concepts/UserAuth/testing.md/steps/response.1ea50adf.md)

[Finalized Tests for UserAuth](../context/src/concepts/UserAuth/UserAuthConcept.test.ts/20251016_222514.3737bd87.md)

### 2. Fixing How the LLM Structured Test Cases

When I used the LLM to generate test cases for `UserAuth`, it kept putting everything inside one giant Deno test block. Technically, it worked, but it was really hard to read or debug. Deno tests are supposed to be small and focused, but the LLM didn’t seem to understand that structure. Subsequent prompting failed to be inefficient.

To fix it, I broke the big test into smaller, more focused ones. It took a bit of manual work, but it immediately made everything cleaner and easier to maintain. After doing this once, I used that file as a model for future test suites the LLM generated. That small change made a big difference in how organized the tests became. It also reminded me that while LLMs can help with speed, they still need structure and a human touch to make the output truly usable.

**Relevant Files**  
[Original LLM Test File (All in One)](../context/design/concepts/UserAuth/testing.md/steps/response.1ea50adf.md)  
[Attempt to Split Tests (Didn’t Work)](../context/design/concepts/UserAuth/testing.md/steps/response.f3ddd315.md)  
[Final Version After Manual Fixes](../context/src/concepts/UserAuth/UserAuthConcept.test.ts/20251016_222514.3737bd87.md)

---

### 3. Realizing the Missing “Undo” Layer for Media Interactions

When I was building the `MediaAnalyticsConcept`, I realized something big was missing. Users could like, comment, and share media, but there wasn’t any way to undo those actions. Once someone liked a post or left a comment, it stayed that way forever, which obviously isn’t how things work in real life. The problem came from how I first structured the system — everything moved in one direction, with no way to reverse it.

Once I noticed this, I decided to rethink the design. Instead of just adding quick “unlike” or “delete” buttons, I plan to build a proper system that can handle both actions and undo actions (and update concept as I iterate going forward). My idea is to make each user event reversible, like a toggle, so users can take things back while the analytics stay accurate. This would make the system feel more realistic and flexible, and it’s something I want to explore further. It’s also made me realize how important it is to design with reversibility in mind, not just forward actions.

**Relevant Files**  
[Initial Media Interaction Implementation (Pre-Undo)](../context/design/concepts/MediaAnalytics/implementation.md/steps/response.5d7a1948.md)  
[Refined Undo-Enabled MediaAnalyticsConcept](../context/src/concepts/MediaAnalytics/MediaAnalyticsConcept.ts/20251017_154321.dfe1aa4a.md)

---

### 4. Dealing with LLM Struggles in Complex Logic (Interest Filter)

The `InterestFilter` feature turned out to be one of the hardest parts to get right. The LLM could write code that looked okay at first, but it didn’t really understand what the feature was supposed to do. It added random mock calls and hardcoded examples that didn’t make sense. Even after I gave it more context and examples of working code from Assignment 3, it still struggled to handle the logic in a flexible way.

In the end, I had to manually add alot of the code from Assignment 3 myself, testing small parts and improving them as I went. It was slower, but it worked. This experience made it clear that for complex, domain-specific features, LLMs can only take me part of the way. The rest still depends on my own reasoning and understanding of the system. It also helped me learn how to write clearer, more structured prompts when asking the LLM for help.

**Relevant Files**  
[LLM’s First Try at Interest Filter](../context/design/concepts/InterestFilter/implementation.md/steps/response.c3d630d9.md)  
[Edited Tests from the LLM](../context/design/concepts/InterestFilter/testing.md/steps/response.c3d630d9.md)  
[Final Manual Implementation](../context/src/concepts/InterestFilter/InterestFilterConcept.ts/20251017_221020.7d4758bd.md)  
[Final Tests After Manual Review](../context/src/concepts/InterestFilter/InterestFilterConcept.test.ts/20251017_221027.ebe744e9.md)

--- 

### 5. Improving How Contradictions Were Handled in the Interest Filter

While working on the `InterestFilter`, one of the trickiest parts was figuring out how to handle contradictions between tags. The LLM’s first version didn’t really get this right as it tried to deal with contradictions by hardcoding specific examples instead of actually checking relationships dynamically. It also threw in mock logic that didn’t fit the context from Assignment 3, so the system couldn’t adapt to real user data. This made the whole feature feel rigid and unrealistic.

As I refined it, I started focusing on making contradiction handling more flexible and user-driven. Instead of having the system automatically decide which tag was right or wrong, I added a warning system inside the concept that flags when two interests conflict. From there, the UI in the future could let users choose between the opposing tags themselves. It felt much more natural and transparent. I also updated the contradiction validator to make this interaction smoother, so users could see what was conflicting and resolve it directly. This whole process taught me that when building features like this, it’s better to design for *user choice* rather than forcing a system decision — especially in areas where people’s preferences can overlap or change over time.

[LLM Implementation for Interest Filter](../../../context/design/concepts/InterestFilter/implementation.md/steps/response.c3d630d9.md)

[Updating Interest Filter Iteration 1](../../../context/src/concepts/InterestFilter/InterestFilterConcept.ts/20251017_210548.34c328ca.md)

[Updating Interest Filter Iteration 2](../../../context/src/concepts/InterestFilter/InterestFilterConcept.ts/20251017_215628.5e7ce4df.md)

[Updating Interest Filter Iteration 3](../../../context/src/concepts/InterestFilter/InterestFilterConcept.ts/20251017_221020.7d4758bd.md)