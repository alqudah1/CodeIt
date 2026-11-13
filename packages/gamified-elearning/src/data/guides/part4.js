// Guides, part 4 of 5. The list is put together in ../guidePages.js,
// which says why it is in parts.

const GUIDES_D = [
  {
    slug: "code-org-is-now-codeai",
    relatedLessons: [1, 6],
    // Kodable's family price, from kodable.com/parents, read 31 August 2026.
    // Declared so the price guards can see it is somebody else's money.
    quotedPrices: ["US$119.99"],
    title: "Code.org Is Now CodeAI: What Changed",
    description: "Code.org rebranded org-wide as CodeAI in June 2026. The domain is still live, CS curriculum still exists, and the emphasis moved to AI literacy.",
    h1: "Code.org Is Now CodeAI: What Changed",
    lastVerified: "2026-08-21",
    targetQueries: [
      "is code.org still around",
      "code.org rebrand codeai",
      "what happened to hour of code",
      "does codeai still teach coding",
      "code.org name change 2026"
    ],
    markdown: `Code.org announced an organisation-wide rebrand to **CodeAI** on 2 June 2026. The name changed; the URL did not. code.org is still live, still in active use, and still free, so if you have been told "Code.org shut down" or "Code.org no longer exists," that is wrong, and it is the single most repeated error about this story.

What did change is the organisation's stated emphasis. CodeAI now describes its mission in terms of **digital fluency** spanning AI science, computer science and data science, rather than computer science alone. The December Hour of Code event is now the **Hour of AI**. Whether that shift is good for your child is a real question with a real answer, and it depends on what you wanted out of the site. This page lays out the evidence and then answers it directly.

**Last verified: 21 August 2026.**

## How we know this is a real rebrand, not a sub-brand

Organisations launch AI-flavoured sub-programs all the time, and those are usually not worth a headline. Three things separate this from that pattern.

1. **The organisation says so in the first person.** The page at [code.org/en-US/codeai](https://code.org/en-US/codeai) states plainly: "Code.org is now CodeAI."
2. **The branding reaches the boring pages.** CodeAI branding now appears on the newsroom and the Terms of Service. Marketing pages get rebranded for campaigns; Terms of Service pages get rebranded when the legal entity's public identity actually changes. This is the strongest single tell.
3. **Independent coverage treated it as an org-level change.** [GeekWire](https://www.geekwire.com/2026/solidifying-its-shift-to-ai-education-code-org-rebrands-as-codeai/) framed it as solidifying a shift to AI education; the Chronicle of Philanthropy and Education Week also covered it.

Leadership context: **Karim Meghji** has been CEO since February 2026, roughly four months before the rebrand was announced.

## The honest answer to "does it still teach coding?"

Yes, and the emphasis has moved.

The computer science curriculum still exists. CS Discoveries, CS Principles, the block-based courses for younger students, the whole existing library. That material did not evaporate on 2 June 2026. A parent whose child is halfway through a course is not stranded.

At the same time, an organisation does not rename itself, restate its mission around digital fluency, and rename its flagship annual event without meaning it. The new material, the new promotion, and the framing at the top of the funnel are AI-forward. CS is now one of three named strands rather than the whole point.

Both of those sentences are true at once. Anyone telling you only the first ("nothing changed, it's just a logo") or only the second ("they abandoned coding") is selling you something. What you should expect over time is that the CS material remains available while the newest, best-promoted, most-maintained content skews toward AI literacy.

## Deciding what that means for your child

| If you wanted... | CodeAI in 2026 | What to consider |
|---|---|---|
| A free, structured K–12 CS course sequence | Still there, still free | Fine to continue. Bookmark your course directly rather than navigating from the homepage |
| Your child to understand how AI works and how to use it critically | Now a core strength | This is the direction the organisation has chosen; expect the newest material here |
| Deep, typed programming practice | Was never CodeAI's centre of gravity | Look at [CodeCombat](https://codecombat.com/), [CodeMonkey](https://www.codemonkey.com/), or [Codecademy](https://www.codecademy.com/), and note Codecademy's Terms of Service §1.A require users to be 16 or older |
| Open-ended creative building | Limited | [Scratch](https://scratch.mit.edu/) remains the strongest free option here |
| A classroom platform for a school | Still a schools platform | CodeAI and [CodeHS](https://codehs.com/) (grades 6–12) remain the main free/low-cost school-facing options |

### Free alternatives if you want CS without the AI framing

| Option | Cost | Ages | Notes |
|---|---|---|---|
| [Scratch](https://scratch.mit.edu/) (MIT) | Free | 8–16 | Block-based, huge shared project community, no AI repositioning |
| [Khan Academy](https://www.khanacademy.org/computing) | Free | ~10+ | Solid teaching, but the CS content runs on legacy ProcessingJS and is visibly aging |
| [freeCodeCamp](https://www.freecodecamp.org/) | Free | Nominally 13+ | Excellent and genuinely free, but built for adults; not designed for kids |
| [Kodable](https://www.kodable.com/parents) | US$119.99/yr for families, four children | 4–10 | K-5 focused. Its free Kickstart plan is a school plan |
| [CodeCombat](https://codecombat.com/) | Freemium | ~9+ | Typed Python/JS in a game |

Scratch is the closest thing to "Code.org before the shift" that still exists at zero cost, and it is not going anywhere. It is an MIT project, not a venture-funded product.

## The follow-up questions parents actually ask

**"Is it still free?"** Yes. CodeAI remains free for K–12 use.

**"Do my child's saved projects survive the rebrand?"** A rebrand is a naming and positioning change, not a platform migration, and accounts and saved work were not reported to be affected. That said, the cheap insurance is universal and worth doing once: if your child has work they care about, download or screenshot it now. This applies to every platform in this document, not just this one.

**"Should I be worried that my child will only learn AI prompting instead of programming?"** This is a fair concern and the honest answer is: watch what they actually do, not what the platform is called. There is a real difference between a child who produces a result with AI and a child who can open up the result, read it, and change it. If your child is using AI tools and never looks underneath, that is a gap regardless of which site they are on. The fix is picking activities that end with the child writing and running code themselves, not picking a vendor.

**"Is Hour of AI still worth participating in?"** For most families and classrooms, yes. The value of that event was always the low-friction, one-hour on-ramp, and that has not changed. Just know what your child is signing up for is now framed around AI concepts.

---

## Disclosure: who published this page

This page is published by **CodeIt** (codeitlearn.com). We make a browser-based coding studio for kids and we compete for the same attention CodeAI gets, so weigh our framing accordingly. We have tried to describe the change without spinning it: CodeAI is free, it is large, its CS curriculum is still real, and for many families continuing there is the right call.

Where CodeIt is a genuine fit is the specific gap described above. Kids describe a website, game or quiz, play what comes back, and change it by moving things and picking colours. A tab then shows what the project is made of and opens the lesson behind each idea in it. AI can help generate a project, but the output stays **editable instead of becoming a locked AI result**: which is the whole point if your worry is that AI tools produce black boxes. The free plan does not expire and needs no card: ten assisted project builds a month and one managed learner profile under a parent view. A paid family plan is available at CA$12 a month, cancellable at any time. There is also a [31-lesson beginner Python sequence](/lessons).

Where CodeIt is not a fit: we are a consumer product for families. We have no school, district, rostering, LMS or teacher-dashboard features. If you are a teacher looking at this because your school used Code.org, CodeAI or CodeHS is the right place to stay. And if your child is under 8 and pre-reading, use codeSpark or Kodable, not us.`,
  },
  {
    slug: "common-sense-education-paused-edtech-reviews",
    relatedLessons: [1, 10],
    title: "Common Sense Paused Edtech Reviews",
    description: "Common Sense Education paused all edtech product reviews from February 2026. Its privacy ratings still run. What schools should use instead.",
    h1: "Common Sense Paused Edtech Reviews",
    lastVerified: "2026-08-21",
    targetQueries: [
      "common sense education reviews discontinued",
      "why is common sense not updating edtech reviews",
      "common sense education alternatives for schools",
      "iste edtech index vs common sense",
      "are common sense privacy ratings still active"
    ],
    markdown: `Common Sense Education **paused all edtech product reviews beginning February 2026**. The existing review pages are still online but frozen. They carry notices saying they are no longer being updated. Separately and importantly, Common Sense's **Privacy Program is still fully operating**, which is a distinction most secondhand summaries have blurred into "Common Sense stopped rating edtech." That is not what happened.

If you are a teacher, coach, or district buyer who used those reviews as a filter, the practical consequence is this: you have lost your single best free source of *learning-quality* ratings, you have not lost your privacy ratings, and no direct replacement with the same methodology exists. This page covers what is verified, what the real alternatives are, and how to run an evaluation yourself now that the shortcut is gone.

**Last verified: 21 August 2026.**

## What is verified

**The pause.** [Tech & Learning reported on 30 January 2026](https://www.techlearning.com/technology/apps/common-sense-education-will-pause-edtech-reviews-beginning-february-2026-what-it-means-for-schools-and-where-to-look-next) that Common Sense Education would pause edtech reviews starting in February 2026. EdTech Institute covered it on 11 February 2026.

**The pages are frozen, not deleted.** Review pages remain reachable and readable. They carry a notice indicating they are no longer being updated. Nothing has been taken down as of this page's verification date.

**Privacy ratings continue.** The Common Sense Privacy Program is a separate operation from the learning-quality reviews and it is still running. The clearest proof is a fresh evaluation issued **26 March 2026**, well after the review pause took effect, for the product Yourway, which received a **93% privacy rating**, announced via PR Newswire. A dormant program does not issue new evaluations with new scores.

This is the split to hold in your head:

| Common Sense program | Status as of August 2026 | What it told you |
|---|---|---|
| Edtech product reviews (learning quality) | **Paused since February 2026**; pages frozen but online | Whether a tool was pedagogically good, with an age rating and a teacher-facing score |
| Privacy Program / privacy ratings | **Active**, issuing new evaluations | How a product handles student data, tracking, ads, and third-party sharing |
| Family-facing media reviews (movies, games, apps) | Outside the scope of this pause | Age-appropriateness of consumer media |

## The alternatives that actually exist

Two cautions before the table.

First: **ISTE does not describe itself as Common Sense's successor.** That framing comes from trade press coverage, which points to ISTE as the leading alternative. ISTE has not claimed the mantle, and it would be dishonest to put those words in their mouth.

Second, and more practically: **these are not like-for-like swaps.** Common Sense's reviews produced an editorial learning-quality judgement, a human reviewer scoring pedagogy against a rubric. The main alternative works differently. If you copy a Common Sense-shaped process onto a differently-shaped directory, you will think you have replaced the signal when you have not.

| Source | What it is | Methodology | Cost |
|---|---|---|---|
| [ISTE EdTech Index / Learning Technology Directory](https://iste.org/edtech-index) | The largest active edtech directory; descends from the EdSurge Product Index, running since 2012 | **Validation-badge system**, products earn badges against criteria, rather than a single learning-quality score | Free to browse; free to list |
| [EdTech Impact](https://edtechimpact.com/) | Directory built around verified reviews from educators who have used the product | Aggregated practitioner reviews | Free to browse |
| Common Sense **Privacy** ratings | Still-active data-privacy evaluations from Common Sense itself | Structured privacy rubric, percentage rating | Free |

The honest summary: **ISTE's index is the best place to discover and shortlist products and to see what a product has been validated for. It is not a drop-in replacement for a learning-quality score, because it does not produce one.** A badge tells you a product met specified criteria; a Common Sense review told you a reviewer thought the product taught well. Those are different claims.

### What to do about the gap

The learning-quality judgement now has to come from you or your colleagues. That is more work, but it is not mysterious. A workable process:

1. **Screen for privacy first**, using Common Sense Privacy ratings. This is still free, still active, and still the fastest way to eliminate products outright. Anything with a poor privacy rating is done, no further evaluation needed.
2. **Shortlist on the ISTE index**, filtering for the badges and evidence claims relevant to your use case.
3. **Check practitioner reviews** on EdTech Impact for whether the thing survives contact with a real classroom.
4. **Run your own 20-minute check** on the two or three survivors. Ask: What does a student actually *do* for the first ten minutes? Is there a task with a right answer, or only exploration? Can a teacher see what a student produced without buying a higher tier? What happens to student work if you stop paying?
5. **Ask the vendor two questions in writing.** Can we export student work in a standard format? What is the deletion process for student data when we leave? A vendor that will not answer those in writing has answered them.

Steps 4 and 5 are what the Common Sense reviews were doing on your behalf. Rebuilding them as a shared department checklist is more sustainable than waiting for another free reviewer to appear.

## Follow-up questions

**"Can I still trust the frozen reviews?"** Partly. A review's description of *what a tool is and how it teaches* ages slowly and is still useful context. Its description of pricing, tiers, features and privacy behaviour ages fast and should be treated as of-its-date only. Always check the review's date, then verify pricing and privacy against the vendor's live site.

**"Is this permanent?"** It was announced as a pause, not a shutdown. Nothing in the coverage commits to a restart date, so plan as if it is indefinite and be pleasantly surprised if it is not.

**"Did Common Sense say why?"** We are not going to characterise the reasoning beyond what was reported. The coverage above is the primary record; read it directly rather than trusting a summary, including this one.

**"Does this affect Common Sense's digital citizenship curriculum?"** That curriculum is a separate offering from the product reviews and was not the subject of this announcement. Verify current status on their site before building a school year around it.

---

## Disclosure: who published this page, and why we are not recommending ourselves here

This page is published by **CodeIt** (codeitlearn.com), which makes a browser-based coding studio for families, built for ages 8 to 14.

We are going to be direct: **for a district evaluation, CodeIt is probably not on your shortlist.** If you arrived here, you are likely evaluating software for a school or district. CodeIt has no rostering, no LMS integration, no standards alignment, no gradebook, no signed data processing agreement and nothing for a district to buy. What it does have is narrower: a teacher can make a class for free: children join at codeitlearn.com/join with a class code and a first name, with no emails and no passwords to hand out, and the teacher sees each child's games and the sentences they typed. That suits one teacher trying coding in one room, not a procurement decision.

For school-facing coding curriculum specifically, the established options are [CodeAI](https://code.org/en-US/codeai) (formerly Code.org, free, K–12), [CodeHS](https://codehs.com/) (grades 6–12), [Kodable](https://www.kodable.com/) for K-5, and [Scratch](https://scratch.mit.edu/) (free, MIT). Evaluate those through the process above rather than taking our word for it.

We wrote this page because the facts were being reported wrongly, specifically the widespread claim that Common Sense stopped rating edtech entirely, when its privacy program demonstrably still issues new ratings.`,
  },
  {
    slug: "replit-teams-for-education-shut-down",
    relatedLessons: [1, 9],
    title: "Replit Teams for Education Shut Down",
    description: "Replit discontinued Teams for Education on 1 August 2024. Replit itself still operates but has exited education. Where teachers moved next.",
    h1: "Replit Teams for Education Shut Down",
    lastVerified: "2026-08-21",
    targetQueries: [
      "replit teams for education discontinued",
      "replit education alternative for teachers",
      "is replit still free for students",
      "replit classroom replacement 2026",
      "what to use instead of replit in class"
    ],
    markdown: `Replit discontinued **Teams for Education on 1 August 2024**. Replit the company is still very much operating, it did not go out of business, but it has exited the education market, and there is no sign of it coming back. Two years on, that combination still confuses people: the product you are searching for is gone, the brand you associate with it is thriving, and most search results predate the change.

If you are a teacher who ran a class on Replit, the honest state of the world is that **no single product replaced it**. Teams for Education combined a zero-install browser IDE, real multiplayer collaboration, and a class management layer in one free package. The successors split those functions apart. This page explains what was lost, what the actual options are, and how to choose between them without wasting a term on the wrong one.

**Last verified: 21 August 2026.**

## What actually happened, and what didn't

**What happened:** Teams for Education was discontinued on 1 August 2024. The education-specific tier, the teacher-facing class layer, went away.

**What did not happen:** Replit did not shut down. It continues as a company with a healthy consumer and developer product. Any page telling you "Replit is dead" is wrong in the same way that "Code.org no longer exists" is wrong. The company pivoted its focus; it did not disappear.

**Why coverage is so thin:** this is the part worth naming. When a widely used classroom tool is discontinued, you would expect a wave of migration guides. That did not really happen here. The most substantive migration write-ups came from two vendors with an obvious interest, [Codeanywhere](https://codeanywhere.com/) and [Pickcode](https://pickcode.io/). Beyond those, teachers have largely been left to work it out in forums and staff rooms. The demand for a straight answer is real and mostly unserved, which is why this page exists.

Read the vendor migration posts. They are useful. Just read them knowing they are written by people who want your class on their platform, exactly as you should read this page knowing who published it.

## Break the problem into three parts

Teams for Education was three products in a trenchcoat. Replace them separately.

| What Replit gave you | Replacement category | Options |
|---|---|---|
| Browser IDE with no installs, works on locked-down school machines | Cloud IDE | [Codeanywhere](https://codeanywhere.com/), [CodeSandbox](https://codesandbox.io/), GitHub Codespaces, Replit's own non-education product |
| Real-time multiplayer editing and pair programming | Collaborative editor | CodeSandbox, VS Code Live Share, GitHub Codespaces |
| Class roster, assignments, visibility into student work | Class management layer | [CodeHS](https://codehs.com/), [CodeAI](https://code.org/en-US/codeai) (formerly Code.org), GitHub Classroom |

The mistake to avoid is picking a tool that nails the first column and discovering in week three that you have no way to see thirty students' work.

## The options, honestly compared

| Option | Best for | What it gives you | Watch out for |
|---|---|---|---|
| [CodeHS](https://codehs.com/) | Grades 6–12, whole-course replacement | The closest thing to a complete teacher-facing platform: curriculum, assignments, student visibility | It is a curriculum platform, not a free-form IDE. If you taught your own syllabus in Replit, this is a bigger change than it looks |
| [CodeAI](https://code.org/en-US/codeai) (ex-Code.org) | K–12, free | Free, large, established, with a real classroom layer. Note the organisation rebranded in June 2026 and its emphasis has shifted toward AI literacy; the CS curriculum still exists | Emphasis has moved; check the current course catalogue matches what you teach |
| [Codeanywhere](https://codeanywhere.com/) | Teachers who mainly needed the cloud IDE | Browser-based development environment; published a Replit migration guide | Developer tool first. Thin on class management |
| [Pickcode](https://pickcode.io/) | Younger or beginner classes | Purpose-built for teaching, published a Replit migration guide | Newer and smaller than what you are leaving; evaluate longevity |
| GitHub Codespaces + Classroom | High school, students headed toward real software work | Genuinely industry-standard tooling and workflow | Steepest setup cost; account and age requirements need checking for minors; free-tier limits change |
| [freeCodeCamp](https://www.freecodecamp.org/) | Motivated high-schoolers, zero budget | Free, substantial, well-maintained | Nominally 13+, built for adults, no teacher view at all |
| [Codecademy](https://www.codecademy.com/) | Older students only | Free Basic tier, $14.99/mo Plus | Its Terms of Service §1.A state "You must be 16 years or older to use the Services", which rules it out for most middle school and much of high school |
| [Scratch](https://scratch.mit.edu/) (MIT) | Younger classes, ages 8–16 | Free, stable, enormous community, not going anywhere | Block-based; not a substitute if you were teaching typed Python or JavaScript |
| [CodeCombat](https://codecombat.com/) | Ages ~9+, engagement problems | Typed Python or JavaScript inside an RPG; freemium | Game framing does not suit every class |

### If you only have ten minutes to decide

- **Teaching a full CS course, grades 6–12, need student visibility:** CodeHS.
- **Zero budget, need free and stable:** CodeAI or Scratch, depending on age.
- **You mostly needed the IDE and already handle assignments elsewhere:** Codeanywhere or CodeSandbox.
- **Older students, want them on real professional tooling:** GitHub Codespaces with Classroom.

## Follow-up questions teachers actually ask

**"Can students still just use Replit individually?"** Replit still operates a non-education product. Before pointing minors at it, check Replit's current terms and age requirements yourself, those are exactly the terms most likely to have changed since 2024, and a two-year-old blog post is not a safe source for them.

**"What happened to the code my classes wrote?"** If it was not exported before the shutdown, assume it is gone. The durable lesson: on any platform you adopt next, confirm on day one that student work exports as plain files, and do an export at the end of every term. This is the single cheapest habit that protects you from the next discontinuation.

**"Is there anything free that does all three columns?"** CodeAI is the closest, and it is free. It is not a free-form IDE in the way Replit was, so it is a substitution rather than a replacement.

**"How do I stop this happening again?"** Prefer tools where the work is plain files you can export, prefer institutions over venture-backed startups when stability matters more than features (Scratch is an MIT project; freeCodeCamp is a nonprofit), and keep the syllabus in a document you own rather than inside a vendor's platform.

---

## Disclosure: who published this page, and why we are not the answer

This page is published by **CodeIt** (codeitlearn.com), which makes a browser-based coding studio for kids, built for ages 8 to 14.

**CodeIt is not a replacement for Replit Teams for Education, and we are not going to pretend otherwise.** We have no rostering, no LMS integration, no assignment workflow, no gradebook, no standards alignment and no district offering. A teacher can run a free class on CodeIt, with children joining on a class code and a first name and the teacher seeing each child's work, but a teacher who needs graded assignments will be missing the entire third column of the table above by the second week.

For a classroom, the honest recommendations are the ones above: CodeHS for a full secondary CS course, CodeAI for free K–12, Codeanywhere or CodeSandbox if the IDE was the part you needed, GitHub Classroom for older students on professional tooling.

The one place we might be worth a look is well outside a school: a **homeschooling parent or an after-school setting with one or two children**, where you want [kids building websites, games and quizzes](/builder) and then opening up the real HTML, CSS and JavaScript underneath. AI can help generate a project and the result stays editable rather than becoming a locked AI result. The free plan does not expire and needs no card: ten assisted project builds a month and one managed learner profile under a parent view. A paid family plan is available at CA$12 a month, cancellable at any time. There is also a 31-lesson beginner Python sequence. Independent accounts start at 13; a younger child uses a parent-managed, email-verified profile that cannot publish publicly.

If that is not your situation, take the list above and ignore us.`,
  },
  {
    slug: "tynker-alternative",
    relatedLessons: [1, 4, 6],
    title: "Tynker Alternatives: What to Use, and When Tynker Is Still the Answer",
    description: "Tynker costs $15 to $18 a month for up to three children. What the alternatives actually are, what each one is better at, and the cases where you should stay.",
    h1: "Is Tynker worth it, and what else is there?",
    lastVerified: "2026-08-26",
    targetQueries: ["tynker alternative", "is tynker worth it", "tynker vs scratch", "cheaper alternative to tynker", "tynker pricing family plan", "coding subscription for kids worth the money", "tynker vs code.org", "best paid coding platform for kids"],
    markdown: `**Short answer:** if your child is under 8, or wants Minecraft and Roblox modding specifically, Tynker is still the best-supported option and the alternatives are worse. If your child is past blocks and you mostly want them building things they can share, you are paying for a course library you will not finish.

This page names prices as they were checked on 26 August 2026, from each product's own pricing page.

## What Tynker actually costs

From [Tynker's pricing page](https://www.tynker.com/pricing/), family plans, with a 40% discount applied at the time of checking:

| Plan | Price | Billed |
|---|---|---|
| Quarterly | $18/month | $54 every three months |
| Yearly | $15/month | $180 a year |
| Lifetime | $468 | once |

All three cover up to three children and carry a 30-day money-back guarantee. Tynker states an age range of 5 to 18, from icon coding for pre-readers up to Python and JavaScript.

That is not a bad price for what it is. The question is whether what it is matches what your child does.

## Where Tynker is genuinely the right answer

**Under 8.** Icon coding for pre-readers is real work to build and almost nobody else does it well. If your child cannot yet read fluently, most of the alternatives on this page are unusable for them.

**Minecraft and Roblox modding.** This is Tynker's strongest hand. The integrations are maintained, they work, and a child who wants to mod the game they already play will stay engaged far longer than with a generic project.

**You want a curriculum, not a tool.** Tynker is a course library with a path through it. If you want to hand a child something structured and step away, that is what it is built for.

If any of those three describe you, stop reading. The rest of this page will not serve you better.

## Where the money stops making sense

The common failure is not that Tynker is bad. It is that a subscription bought for a 7-year-old is still being paid for at 11, when the child has outgrown blocks and the text-code courses feel like homework rather than making something.

At that point you are paying a monthly fee for a library, and the child is not opening it. The honest move is to cancel and pick a tool aimed at what they do now.

## The alternatives, and what each is actually for

**[Code.org](https://code.org/).** Free, and it stays free. Rebranded to CodeAI on 2 June 2026, with the Hour of Code now the Hour of AI, and it [continues to provide free curriculum, tools and professional learning resources](https://code.org/en-US/codeorg-is-now-codeai). Best for structured courses at no cost. Weakest at open-ended making: a child who wants to build their own thing and share a link will find it closed-ended.

**Scratch**: free, from MIT, block-based, and still the best on-ramp there is. It is not an alternative to Tynker so much as the thing Tynker's early levels are competing with. If your child is happy in Scratch, there is no reason to pay anyone.

**The p5.js Web Editor**: free, text-based JavaScript, no account needed to start. Best for a teenager who already wants to write code. Nothing about it is designed for children, and that is the point.

**CodeIt**: this is us, so weigh it accordingly.

## Disclosure: we make one of these

CodeIt is a browser-based coding studio built for ages 8 to 14, in Toronto. A learner describes a website, game or quiz, plays what comes back, and changes it by moving things and picking colours or asking in plain language. A separate view shows what the finished project is made of and opens the lesson behind each idea in it. There are [31 beginner Python lessons](/lessons).

Free plan: no card, ten AI-assisted builds a month, and the lessons and Python playground stay free. Paid family plan CA$12 a month, cancellable at any time. Note that is Canadian dollars against Tynker's US dollars, so compare the numbers in your own currency rather than taking the gap at face value.

**Where CodeIt is genuinely the better fit:** a child aged 8 to 14 who has outgrown blocks, wants to make things rather than take a course, and whose parent wants some evidence of understanding rather than a completion badge. The comprehension questions are generated from the learner's own file, so the right answer is whatever they actually wrote.

**Where Tynker beats us, plainly:** it is older, larger, better supported, and has a proper curriculum. It works for pre-readers and we are weaker there. It has Minecraft and Roblox and we have neither. If those matter to your child, buy Tynker.

**What we do not do at all:** no rostering, no LMS integration, no standards alignment, no gradebook and no district plan. A teacher can run a free class with a class code; a district cannot deploy it.

## The version of this page you should trust

Any comparison page written by one of the products is worth reading sceptically, including this one. The test is whether it tells you when to buy the competitor. If a page never does that, it is an advert.
## Common questions

**Is Tynker worth it?**
It depends on three things. If your child is under 8, or wants Minecraft and Roblox modding, or you want a curriculum to hand over rather than a tool, then yes, and the alternatives are worse. If your child is past blocks and mostly wants to build things they can share, you are paying monthly for a course library nobody is opening.

**How much does Tynker cost?**
From Tynker's own pricing page, checked 26 August 2026, with the 40% discount that was showing: $18 a month billed quarterly at $54, $15 a month billed yearly at $180, or $468 once for lifetime. All three cover up to three children and carry a 30-day money-back guarantee.

**Tynker vs Scratch: what is the difference?**
Scratch is free, from MIT, and is what Tynker's early levels compete against rather than an alternative to them. Tynker adds icon coding for pre-readers, Minecraft and Roblox integrations, and a structured path. If your child is happy in Scratch, there is no reason to pay anyone.

**Tynker vs Code.org: which is better?**
Code.org, now CodeAI since 2 June 2026, is free and stays free, and is stronger if you want structured courses at no cost. Tynker is better for pre-readers and for game modding. Both are closed-ended: a child who wants to build their own thing and send someone a link will find the walls in either.

**What is a cheaper alternative to Tynker?**
Free ones first: Scratch, Code.org and Google CS First cover most of what a Tynker subscription buys for a child aged 8 to 11. The p5.js Web Editor is free and suits a teenager who already wants to write code. CodeIt has a free plan with no card and a CA$12 family plan, which is Canadian dollars against Tynker's US dollars, so convert before comparing.

**When should I cancel a kids coding subscription?**
When the child has stopped opening it. The common pattern is a plan bought for a 7-year-old still being paid at 11, once blocks feel babyish and the text courses feel like homework. The library is not the problem at that point, the fit is.
`,
  },
];

export { GUIDES_D };
