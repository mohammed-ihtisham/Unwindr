# Project Reflection: Unwindr

## What Was Hard

**Scope management**: The hardest part was accepting that my initial vision was too ambitious. I had to make difficult decisions to cut features I was excited about (QualityRanking, MediaAnalytics, user contributions) because they simply weren't feasible for an MVP. Learning to say "not yet" instead of "yes" was challenging but crucial.

**Cost discovery**: I didn't realize how expensive Google Maps API would be until I actually researched it. This was a wake-up call that forced me to pivot to OpenStreetMap, which turned out to be a better solution anyway. I should have checked API costs and infrastructure requirements before designing the initial concept.

**LLM-generated code quality**: When working on InterestFilter, the LLM frequently generated mock code and hardcoded examples instead of proper validation logic. I had to repeatedly refine prompts and provide more context to get usable code. This taught me that LLMs need very specific instructions and context to generate production-quality code.

**Database optimization**: Understanding when to use full objects vs. IDs, how to structure GeoJSON for MongoDB's geospatial queries, and optimizing query patterns was a learning curve. I made several iterations before landing on the right data model.

## What Was Easy

**Concept design**: Once I understood the concept framework, designing the high-level structure of concepts, their actions, and validators felt intuitive. The separation of concerns made it easy to reason about each concept independently.

**Using OpenStreetMap**: Once I discovered OpenStreetMap, working with their data was straightforward. The Overpass API and GeoJSON format were well-documented, and bulk importing was simpler than I expected.

**Iterative refinement**: Having a clear process of design → implement → test → refine made it easy to make incremental improvements. Each iteration made the design better, and seeing the progress was motivating.

## What Went Well

**Scope reduction**: Although it was hard, reducing scope from nationwide to local (Cambridge/Boston) was one of my best decisions. It made the project actually feasible and forced me to focus on core value.

**Separation of concerns**: Splitting MediaGallery into MediaLibrary and MediaAnalytics, and moving initialization scripts out of concepts, made the codebase much cleaner and more maintainable. This architectural decision paid off throughout development.

**Database optimization**: Switching to MongoDB GeoJSON format and using ID types instead of full objects significantly improved query performance and made the data model more scalable.

**Bookmark concept**: Adding the Bookmark concept was straightforward because I kept it simple and focused. It solved a real user need without adding unnecessary complexity.

## Mistakes and How to Avoid Them

**Not checking costs early**: I designed the entire system assuming Google Maps would work, then discovered it was too expensive. **Lesson**: Always research API costs, infrastructure requirements, and external dependencies before finalizing the design.

**Assuming scale exists**: I built features (QualityRanking, MediaAnalytics) that assumed user engagement data I didn't have. **Lesson**: Build for the scale you have, not the scale you want. Add scale-dependent features later when the data exists.

**Over-engineering moderation**: I included moderation features in UserAuth without considering whether they were needed for an MVP. **Lesson**: Don't build infrastructure for problems you don't have yet. Add features when there's actual need, not theoretical need.

**Mixing concerns**: Initially, I put data initialization methods in concepts, blurring the line between runtime functionality and deployment setup. **Lesson**: Keep concepts focused on their core responsibility. Move one-time setup tasks to scripts.

## Skills Acquired

**Product scoping**: I learned to balance ambition with feasibility, making difficult decisions about what to build now vs. later.

**API research and selection**: I became better at evaluating APIs based on cost, documentation quality, and fit for the use case.

**MongoDB optimization**: I gained experience with geospatial queries, GeoJSON formatting, and optimizing document structure for performance.

**Concept-driven design**: I learned to think in terms of concepts, actions, validators, and state, which made the architecture more modular and maintainable.

**Cost-conscious development**: I developed better instincts for identifying expensive operations and finding open-source alternatives.

## Skills to Develop Further

**Prompt engineering**: I need to get better at crafting prompts that produce production-quality code from LLMs without multiple iterations.

**Testing strategies**: I should develop more comprehensive testing approaches, especially for LLM-integrated features like InterestFilter's natural language interpretation.

**Performance optimization**: While I optimized for MongoDB, I could learn more about query optimization, indexing strategies, and caching patterns.

**User research**: I made assumptions about what users need without much user research. Learning to validate assumptions earlier would improve future projects.

**Deployment and DevOps**: I focused on development but could improve my knowledge of deployment pipelines, monitoring, and production best practices.

## Using the Context Tool

The Context tool was invaluable for maintaining continuity across development sessions. I used it to:
- Store immutable snapshots of concept specifications as they evolved
- Track design decisions and rationale over time
- Reference previous implementations when making changes
- Share context with the LLM about architectural decisions

The tool helped me avoid repeating mistakes and maintain consistency across the codebase. However, I sometimes struggled with organizing context effectively—too much context could overwhelm the LLM, while too little meant it would generate code that didn't fit the existing architecture.

## Using Agentic Coding Tools

I used agentic coding tools (like Cursor) extensively for:
- Generating boilerplate code for concepts and actions
- Implementing validators and state management
- Refactoring code when design changed
- Debugging and fixing errors

**What worked well**: The tools were great for generating repetitive code, implementing straightforward logic, and making refactorings across multiple files. They saved significant time on boilerplate.

**Challenges**: The tools sometimes generated code that looked correct but didn't match the existing patterns or violated architectural principles. I had to review carefully and often make manual adjustments.

**Key insight**: Agentic tools are most valuable when you provide very specific context about existing patterns, architecture, and constraints. Generic prompts produce generic code that doesn't fit your system.

## Conclusions About LLMs in Software Development

**LLMs are powerful assistants, not replacements**: They excel at generating boilerplate, implementing well-defined patterns, and making repetitive changes. But they struggle with architectural decisions, understanding complex systems, and generating code that fits existing patterns without explicit guidance.

**Context is critical**: The quality of LLM output is directly proportional to the quality and specificity of context provided. Generic prompts produce generic code; detailed context about architecture, patterns, and constraints produces much better results.

**Review is essential**: Never blindly trust LLM-generated code. Always review for correctness, adherence to patterns, and fit with the existing system. LLMs can generate plausible-looking code that's subtly wrong.

**Iteration is normal**: Expect to iterate on prompts and review/refine output. The first generation is rarely perfect, but with good feedback loops, LLMs can be highly productive.

**Best for well-defined tasks**: LLMs work best when the task is well-defined with clear inputs, outputs, and constraints. Vague or exploratory tasks produce poor results.

**Appropriate role**: LLMs are excellent for accelerating development, reducing boilerplate, and implementing straightforward logic. But they're not good at making architectural decisions, understanding business requirements, or generating creative solutions. The developer's role is to provide vision, architecture, context, and quality control.

The key is finding the right balance: use LLMs to accelerate what they're good at (implementation, refactoring, boilerplate) while maintaining human oversight for what matters most (architecture, design, quality, correctness).

