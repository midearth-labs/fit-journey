---

Create a KnowledgeBase Entity, a Question will link to a KnowledgeBase entity so that a user looking at a question can click a "Learn More" button, the knowledge base could include a title, markdown description, tags, related knowledge-bases, and a learn_more_links field like an array of Array of Links/Resources and Link types e.g. IG videos, youtube shorts etc, or just plain images, Blogs, or such? 

---

Update the Question and PassageSet and DailyChallenge and GameSession entities to reflect the following expectations
1. In a daily challenge, there could be a combination of stabdalone questions, and also passage-based questions e.g. Q1: standalone 1, Q2: standalone 2, Q3 - Q7: passage 1 based questions, Q8: standalone 3, Q9 - Q10: passage 1 based questions

Also, create/update the requirements to match these updated behaviour.

--- 

Update the requirements such that the DailyChallenge is pre-generated and imported just like questions etc.

Do not overwrite existiung Requirement IDS, always create new ones and delete un-needed ones as necessary.

---


Update the seed/import requirements R1.2, R1.3, R1.4 to reflect the below:
- GameTypes will be an input
- Data will be pre-generated using LLMs and follopw the format of the static content entities. The data will be coherent across all multiple entities so the prompt used needs to reflect that
- Data will be stored as JSON files and commited to repository
- They will not be seeded into an actual SQL database table.

*IMPORTANT:* Do not overwrite existing Requirement IDS, always create new ones and delete un-needed ones as necessary.

---

Update Streak related requirements such that the data structure referenced in the entities.md is reflected in the requirements. 

---


Cross-check that the requirements.md do not define a behaviour that do not have defined properties/entities in entities.md

---


Add or refine important requirements into requirements.md file based on the comments in the entities.md file. Example of a missing requirement is the one on GameSession.attempt_count


*IMPORTANT:* Do not overwrite/replace existing Requirement IDS, introduce new IDs as needed.

---
