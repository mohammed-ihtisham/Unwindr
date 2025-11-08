# Project Reflection: Unwindr

## What Was Hard

**Managing scope**  
The biggest challenge was realizing my original idea was way too ambitious. I wanted to build a nationwide platform with features like QualityRanking, MediaAnalytics, and user-generated places, but that just wasn’t realistic for a first version. Learning to say “not yet” instead of “yes, let’s build it” was surprisingly tough. It taught me that scoping isn’t about giving up on ideas but rather how it’s about protecting the project from collapsing under its own weight.

**Discovering real costs**  
I didn’t think much about API pricing until I really looked into the Google Maps API when working on the backend and realized how quickly costs could pile up. That moment forced me to rethink my whole approach and switch to OpenStreetMap. It was humbling, but also empowering as I learned that open-source tools can be just as good (and sometimes better) if you’re willing to adapt.

**Figuring out data modeling**  
Designing a database that handled geospatial data efficiently was harder than I expected. I had to learn how GeoJSON works in MongoDB, when to store full objects vs. just IDs, and how to query efficiently. I went through multiple versions before finding a structure that felt right. That process made me appreciate how much good data modeling shapes the entire system.

## What Was Easy

**Concept design**  
Once I wrapped my head around the concept-driven architecture, it started to click. Thinking in terms of concepts, actions, and validators made it easy to reason about each piece separately. It made the system feel modular and understandable, which helped me move faster later on.

**Using OpenStreetMap**  
After switching from Google Maps, OpenStreetMap felt refreshingly simple. The documentation was clear, and the Overpass API just worked. It was one of those “why didn’t I do this sooner?” moments Sure, Google Maps would have provided much better data, but in this case, we had to be cost-aware to make the best decisions for the project.

**Iterating gradually**  
The cycle of design → implement → test → refine made the project flow naturally. Each iteration helped me see visible improvement, which made it much easier to stay motivated and focused.

## What Went Well

**Narrowing the focus**  
Reducing scope to just the Cambridge/Boston area ended up being one of the best decisions I made. It kept the project achievable and meaningful, instead of spreading too thin.

**Cleaner architecture**  
Splitting MediaGallery into MediaLibrary and MediaAnalytics made the system easier to maintain. Similarly, moving initialization code out of concepts helped me avoid messy dependencies. Those small architectural changes had big payoffs later.

**Database improvements**  
Once I switched to GeoJSON and ID-based references, performance noticeably improved. It felt like proof that thoughtful database design really matters.

**Bookmark concept**  
The Bookmark feature was a small but satisfying win—it was simple, purposeful, and genuinely useful. It reminded me that not every good idea has to be complex.

## Mistakes and Lessons Learned

**Not checking costs early**  
Designing around expensive APIs before checking their costs was a rookie mistake. *Lesson learned:* always research dependencies early. It’s easier to adapt your design on paper than in production.

**Building for hypothetical scale**  
I added features like MediaAnalytics without having enough user data to justify them. *Lesson:* build for the scale you have, not the scale you wish you had.

**Over-engineering too soon**  
I added moderation tools in UserAuth even though I didn’t have users yet. *Lesson:* build for real problems, not imaginary ones.

## Skills I Developed

- **Product scoping:** Learned how to balance ambition and feasibility.  
- **API research:** Became better at evaluating cost, usability, and long-term fit.  
- **MongoDB optimization:** Gained hands-on experience with geospatial queries and data shaping.  
- **Concept-driven architecture:** Learned to think modularly and structure systems around concepts.  
- **Cost-aware design:** Started prioritizing sustainable, open-source approaches.

## Skills I Still Want to Improve

- **Testing strategies:** I need stronger automated and LLM-based testing for more complex features.  
- **Performance tuning:** There’s still more to learn about indexing, caching, and query optimization.  
- **User research:** I relied too much on intuition; I’d like to back design decisions with actual user feedback.

## Using the Context Tool

The Context tool became a kind of living notebook for the project. I used it to:
- Record evolving concept specs  
- Document why I made certain design choices  
- Keep consistent patterns across development sessions  

It made the project feel cohesive, even after weeks of iteration. The only challenge was learning to manage how much context to provide—too much could confuse the LLM, but too little made it lose track of structure. The main issue I endured with it was using it to update code for files that already had some content as often it seemed to redo it competeely in undesired ways. While it was good for creating new files, it was fairly hard to use to make changes to existing files, which I wonder whether it was due to poor prompt engineering on my end.

## Using Agentic Coding Tools

Tools like Cursor saved me countless hours writing boilerplate code and doing repetitive refactors. They worked best when I gave them detailed context—architecture, naming conventions, and examples. Without that, the generated code often *looked* right but didn’t fit the system’s logic.

**Big takeaway:** LLMs amplify clarity. The clearer my instructions, the better the outcome. Vague prompts always produced vague code.

## Conclusions About LLMs in Software Development

- **They’re assistants, not architects.** LLMs are great at structured implementation, but not at understanding full systems or making nuanced design decisions.  
- **Context makes or breaks results.** The more specific the context, the better the code.  
- **Human review is non-negotiable.** LLMs can write convincing code that’s subtly wrong.  
- **Iteration is part of the process.** The first output is rarely perfect; refinement is where the value comes.  
- **They shine in repetition, not innovation.** Perfect for boilerplate, refactoring, and pattern-based work—but vision and architecture remain human tasks.

**In short:** LLMs can be incredible accelerators when guided well. The developer’s role is to provide the clarity, structure, and judgment that make the collaboration meaningful.
