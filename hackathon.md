# **KeeperHub - Agents Onchain Hackathon**

The Last Mile
Most agent hackathons reward reasoning: an agent that decides something clever. The harder problem is what happens next. Agents can detect and decide, but they all hit the same wall when they need to move value onchain. Failed transactions, gas spikes, MEV, no observability, no guarantees.

KeeperHub is the execution and reliability layer that fills it: the last mile between what your agent decides and a transaction that acts onchain. This hackathon is about what you build on top of that.

We reward agents that execute onchain, a working transaction that executes through KeeperHub beats a polished demo that never touches a chain, make sure to build something that runs.

What to build
Every project must use KeeperHub as its onchain execution layer. That is the one requirement. Bring any agent framework you like, ElizaOS, OpenClaw, Hermes, CrewAI, LangChain, AutoGPT, or your own, and let KeeperHub handle the actual execution.

The KeeperHub stack
KeeperHub is open source, so you can inspect exactly what is running your agent's execution.

MCP server / CLI. How your agent discovers and calls KeeperHub's execution capabilities natively. https://docs.keeperhub.com/ai-tools/mcp-server

x402 / MPP. Pay-per-execution over HTTP, settled onchain, indexed on x402scan.com. Or have autonomous payments via Tempo and Stripe. Dual-protocol routing lets clients auto-select between x402 and MPP. https://docs.keeperhub.com/ai-tools/agentic-wallet

Smart Gas Estimation. Intelligent gas pricing that adapts to congestion with exponential backoff, so transactions execute instead of getting stuck.

Private routing. MEV protection via non-public submission paths.

Audit trail. Every action logged: trigger, simulation result, submitted transaction, gas used, outcome, timestamp.

Gas sponsorship: KeeperHub offers gas sponsorship on mainnet Ethereum.

Timeline
All times are UTC+2.

July 27, 2026, 12:00 - Hackathon opens.

July 27 to August 13 - Build phase. Roughly 2.5 weeks, with office hours.

August 13, 2026, 12:00 - Submission deadline. Registrations and BUIDL submissions close.

August 13 to 20 - Judging.

August 17 to 19 - Finalist pitches. 10 shortlisted teams present live to the judging panel. Time and joining details shared with finalists in advance.

August 20 - Winners announced.

Prizes
$5,000 in cash.

Grand Prize. One overall ranking, judged across every submission. The top three projects can come from anywhere, including the same topic area. What matters is that your agent executes real transactions onchain through KeeperHub.

Main prizes

Prize 1st $2,000

2nd $1,200

3rd $800

Bounties.

Awarded separately and stackable with the Grand Prize. A project can place in the top three and still win a bounty.

Total bounties amount: $1,000. This amount will be split among two winners for the Best Onboarding UX Improvement. This bounty rewards the contribution that most improves the new-builder experience, getting someone from zero to their first transaction executed faster: a merged PR to the KeeperHub repo, a starter template, a tutorial, or a clear teardown of where you got stuck with proposed fixes. KeeperHub is open source, so fresh eyes are the fastest way to make it better.

Cash prizes are distributed via stablecoins.

Eligibility
Open to builders worldwide, solo or in teams, 18 and over. You do need to ship a working agent that executes through KeeperHub.

Participants from regions subject to applicable sanctions (including OFAC-restricted jurisdictions) are not eligible, per the DoraHacks platform terms.

Every submission must use KeeperHub as its onchain execution layer. How your agent reasons and decides is entirely up to you.

Judging criteria
Execution is weighted heavily, because that is the point.

Does it execute onchain via KeeperHub? Working transactions, not mockups. Every team links a transaction their agent has executed.

Use of KeeperHub surfaces. MCP server, CLI, x402, MPP, workflow builder, audit trail.

Reliability and observability. Does the build show it understands failure modes? Retries, gas handling, and audit trail usage all count.

Originality and real-world usefulness. Would anyone actually run this?

Integration quality and developer experience. How cleanly is it built?

How judging runs
Given the volume of submissions, judging happens in two stages. First, the KeeperHub team reviews every submission against the criteria above, to select a shortlist of 10 finalists. Those finalists are then invited to present their project live to our judging panel in a short pitch session during the judging window. Final rankings and winners are decided from those live pitches alongside the scored review. If you are shortlisted, we will reach out with the format and your slot.

How to submit
Submit your BUIDL on this page before the deadline. Each submission requires:

A link to your source code on GitHub.
A short demo video showing your agent executing onchain through KeeperHub.
A link to a transaction your agent executed via KeeperHub.
Incomplete submissions cannot be judged, so leave time before the deadline to wrap up.

Support
Questions during the build go to the builder channel, where KeeperHub engineers hold office hours for the duration of the hackathon.

Link tree: https://keeperhub.com/links
Discord ('general' / 'help' channel): https://discord.gg/keeperhub
Docs: https://docs.keeperhub.com/
About KeeperHub
KeeperHub is the execution and reliability layer for AI agents operating onchain.

Agents can think, KeeperHub lets them act. We do not replace agent frameworks or compete with them. We are the infrastructure they plug into when they need to actually transact onchain with guarantees.

This hackathon is an invitation to build on that last mile, ship an agent that executes onchain.

# question:

## **Are testnet transactions accepted for the required submission transaction link?**

Background and context:  
Every submission must include a link to a transaction our agent executed via KeeperHub, and judging weights "working transactions, not mockups" heavily. However, I could not find anything in the rules that specifies which network that transaction has to be on.  
  
What I have already found:  
- The hackathon page mentions gas sponsorship on mainnet Ethereum, which reads like an incentive rather than a requirement.  
- The KeeperHub docs list Ethereum, Base, Arbitrum, Polygon, and Sepolia as supported chains, and the Getting Started guide recommends beginning on Sepolia before moving to an automated schedule.  
- The Agentic Wallets docs state that x402/MPP signing is only supported on Base (8453), Tempo mainnet (4217), and Tempo testnet (42431), so payments cannot settle on Sepolia.  
  
What I need clarification on:  
1. Will a testnet transaction (e.g. Sepolia) be accepted as the required transaction link, or must it be on mainnet?  
2. If we use x402/MPP for payments, is a mixed setup acceptable, i.e. agent execution on a testnet while payments settle on Base?  
3. Does using mainnet Ethereum (and the gas sponsorship) carry any weight in judging compared to a testnet submission?  
  
Thanks!

#### **1 Reply**

**Malpiedi @ KeeperHubOrganizer**

2026/07/16

Hey mate, thanks for your questions.  
  
Testnet (incl Sepolia) is accepted and won't be marked down, mixing execution and payment networks is fine, and mainnet is a strengthener for your reliability story rather than a rule.

Question For Onboarding UX Improvement
hello. for UX improvement, can I start to contribute in the repo today &amp; make a PR? or should I wait &amp; hold my PR till july 27th? and one question for me is why I can't register myself as a hacker in this hackathon? I need the assistance. thank you.
5 Replies

Malpiedi @ KeeperHub
Organizer

Resolved
2026/06/30
Hi David, thanks for the interest and for getting in early.

On contributions and timing: feel free to explore the repo and start prototyping now so you understand the codebase before the clock starts. For the work to count toward the Best Onboarding UX Improvement bounty, though, it needs to be submitted within the official window. The hackathon opens on July 27 and the submission deadline is August 13, so the cleanest approach is to keep your work in a fork or branch now and open your PR once the event goes live on the 27th. A PR opened before the event officially starts would fall outside the judging window.

Appreciate you being here early, and let us know if anything else is unclear.


Reply

Malpiedi @ KeeperHub
Organizer
reply to
hacker795bd2d

2026/07/03
ooops - answered your question from my other account , sorry for the confusionn!


Reply

hacker795bd2d

2026/07/03
Hi David,

There's no mandated branch-name convention you have to match. Work from a fork of the repo and put your changes on your own feature branch named for what the change does, something like onboarding/clearer-quickstart or fix/wallet-setup-docs. Descriptive is all we're after, so reviewers can tell at a glance what the PR touches.

If there's a CONTRIBUTING file in the repo, follow whatever it specifies over this, but the short version is: fork, feature branch, PR into main once the event opens on the 27th. Let us know if anything else comes up.


Reply

David Pratama
Author
reply to
Malpiedi @ KeeperHub

2026/07/02
anyway is there any specific PR branch name that I should name for this hackathon? or should I use the staging branch as the primary branch to be used in this hackathon?


Reply

David Pratama
Author
reply to
Malpiedi @ KeeperHub

2026/07/02
thank you for the guidance🙏


Reply



## **Que regarding ux bounty and proofs of real onchain exec.**

What specific evidence of reliable onchain execution (beyond providing one successful tx hash) and use of KeeperHub surfaces like MCP + x402/MPP + audit trails would most strengthen a submission for the Grand Prize? For the Best Onboarding UX bounty, would a public, well-documented starter template or teardown that measurably reduces time-to-first-tx for new builders (even if the PR isn't fully merged yet) be considered high-impact if shared openly during the event?

#### **1 Reply**

**Malpiedi @ KeeperHubOrganizer**

**Resolved**

2026/06/26

On the Grand Prize: one tx hash proves you reached the chain once, but the criteria weight reliability and observability heavily, so the strongest submissions show execution holding up where it normally breaks. Show more than one execution across varied states, and ideally the retry and gas logic doing real work. A transaction that failed or hit a gas spike first and then landed on retry is far more convincing than a single clean send. Use the audit trail as your proof surface: it logs trigger, simulation, submitted tx, gas used, outcome, and timestamp, so exporting that sequence demonstrates the full path from decision to confirmation rather than just the endpoint.   
  
On the Onboarding UX bounty: yes, and a merged PR is not required. A starter template or boilerplate is eligible on its own, as is a teardown of where a builder got stuck with concrete proposed fixes. A public, well-documented version shared openly during the event is exactly what this bounty rewards. A submitted PR is a cherry on top.  
  
AGAIN, the above are guiding principles but so feel free to also go above and beyond or take some other approaches that you can back up.  
  
Happy building.  
  
/   
Luca