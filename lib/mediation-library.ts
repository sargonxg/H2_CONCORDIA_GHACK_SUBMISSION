// ── CONCORDIA Conflict Resolution Library ──
// Typed knowledge base powering the library page, advisor chat, and framework selector.

export interface Technique {
  name: string;
  description: string;
  whenToUse: string;
}

export interface FrameworkEntry {
  id: string;
  name: string;
  shortName: string;
  authors: string[];
  year: number;
  seminalWork: string;
  category:
    | "negotiation"
    | "mediation"
    | "transformation"
    | "analysis"
    | "escalation"
    | "psychology";
  corePrinciples: string[];
  keyTechniques: Technique[];
  diagnosticQuestions: string[];
  bestFor: string[];
  limitations: string[];
  glaslStages: string | number[]; // "1-3" | "4-6" | "7-9" | "all" | [1,2,3,...]
  tacitusPrimitives: string[];
}

// ══════════════════════════════════════════════════════════════════════════════
// FRAMEWORKS
// ══════════════════════════════════════════════════════════════════════════════

export const FRAMEWORKS: FrameworkEntry[] = [
  // ── 1. Fisher & Ury ──────────────────────────────────────────────────────
  {
    id: "fisher-ury",
    name: "Principled Negotiation (Getting to Yes)",
    shortName: "Fisher & Ury",
    authors: ["Roger Fisher", "William Ury", "Bruce Patton"],
    year: 1981,
    seminalWork: "Getting to Yes: Negotiating Agreement Without Giving In (1981)",
    category: "negotiation",
    corePrinciples: [
      "Separate the people from the problem — deal with relationship and substance independently",
      "Focus on interests, not positions — ask why parties hold their stated demands",
      "Invent options for mutual gain — brainstorm without committing, expand the pie before dividing",
      "Insist on objective criteria — use fair standards external to either party's will",
      "Know your BATNA — Best Alternative to a Negotiated Agreement defines your walk-away point",
    ],
    keyTechniques: [
      {
        name: "BATNA Analysis",
        description:
          "Each party identifies their best alternative if negotiations fail. The stronger your BATNA, the more negotiating power you hold.",
        whenToUse:
          "Before any negotiation begins and whenever impasse is threatened.",
      },
      {
        name: "Interest Excavation",
        description:
          "Systematically ask 'why?' behind every stated position to uncover underlying needs, fears, and desires.",
        whenToUse:
          "Whenever parties state rigid positions; use in Discovery phase.",
      },
      {
        name: "Criteria Anchoring",
        description:
          "Propose standards from law, market value, expert opinion, or precedent as the basis for agreement rather than power.",
        whenToUse:
          "When parties argue over 'fair share' or value distribution.",
      },
      {
        name: "Option Generation Brainstorm",
        description:
          "Separate invention from evaluation — generate many options without commitment, then evaluate against interests.",
        whenToUse:
          "Exploration and Negotiation phases after interests are understood.",
      },
      {
        name: "One-Text Procedure",
        description:
          "Mediator drafts a single text, both parties critique it, revised iteratively toward consensus.",
        whenToUse: "Late-stage negotiations when direct exchange has stalled.",
      },
    ],
    diagnosticQuestions: [
      "What does each party actually need that their stated demand is trying to satisfy?",
      "What would each party do if this negotiation fails entirely?",
      "Are there external standards — legal, market, expert — that both parties would accept?",
      "What options could satisfy both parties' interests simultaneously?",
      "Is either party conflating the person with the problem?",
    ],
    bestFor: [
      "Commercial and contractual disputes",
      "Resource allocation conflicts",
      "Workplace disputes with clear substantive issues",
      "Multi-party negotiations with overlapping interests",
      "Early to mid-stage conflicts (Glasl stages 1–5)",
    ],
    limitations: [
      "Assumes rationality — may underperform in high-emotion or identity-based conflicts",
      "Requires both parties to be willing to engage in interest-based dialogue",
      "Less effective at Glasl stages 6+ where win-win thinking has collapsed",
      "Power imbalances can undermine 'objective criteria' if one party controls standards",
    ],
    glaslStages: "1-5",
    tacitusPrimitives: ["Claim", "Interest", "Leverage", "Commitment"],
  },

  // ── 2. Ury — Getting Past No ─────────────────────────────────────────────
  {
    id: "ury-past-no",
    name: "Breakthrough Negotiation (Getting Past No)",
    shortName: "Ury — Past No",
    authors: ["William Ury"],
    year: 1991,
    seminalWork: "Getting Past No: Negotiating in Difficult Situations (1991)",
    category: "negotiation",
    corePrinciples: [
      "Go to the balcony — pause, step back, and observe the negotiation from a distance before reacting",
      "Step to their side — disarm the opponent by acknowledging their perspective before advocating your own",
      "Reframe — redirect attacks on you toward attacks on the problem",
      "Build them a golden bridge — make it easy for the other side to say yes by addressing face-saving needs",
      "Use power to educate, not to coerce — raise costs of no-agreement without threatening",
    ],
    keyTechniques: [
      {
        name: "The Balcony",
        description:
          "Mental technique: when under pressure, imagine stepping onto a balcony overlooking the negotiation. Pause before responding.",
        whenToUse: "When emotionally triggered or feeling manipulated.",
      },
      {
        name: "Side-Stepping",
        description:
          "Agree with the other party wherever possible ('You're right that…') before pivoting to your concern.",
        whenToUse:
          "When the other party is in attack mode or feeling unheard.",
      },
      {
        name: "Problem Reframe",
        description:
          "Convert personal attacks into collaborative problem statements: 'That's interesting — how do we solve that together?'",
        whenToUse: "When dialogue becomes positional or adversarial.",
      },
      {
        name: "Golden Bridge Construction",
        description:
          "Help the other party save face by building a narrative where saying yes feels like a victory for them.",
        whenToUse:
          "Late-stage negotiations when the other party is resistant for ego or political reasons.",
      },
      {
        name: "BATNA Demonstration",
        description:
          "Inform (don't threaten) the other party of your alternatives, strengthening your position without escalating.",
        whenToUse: "When the other party underestimates your walkaway point.",
      },
    ],
    diagnosticQuestions: [
      "Is either party reacting emotionally rather than strategically?",
      "What face-saving concerns prevent the resistant party from agreeing?",
      "Are attacks personal or substantive — and can they be reframed?",
      "What would make saying 'yes' feel like a win for the other side?",
      "Has either party communicated their BATNA clearly and credibly?",
    ],
    bestFor: [
      "Negotiations with a difficult or positional counterpart",
      "High-stakes dealmaking with resistant parties",
      "Situations where the other side refuses to engage constructively",
      "Buyer-seller and employer-employee disputes",
    ],
    limitations: [
      "Assumes one party is willing to be strategic while the other is difficult",
      "May feel manipulative if the 'golden bridge' is perceived as disingenuous",
      "Less suited to multi-party disputes",
    ],
    glaslStages: "1-6",
    tacitusPrimitives: ["Claim", "Interest", "Leverage", "Narrative"],
  },

  // ── 3. Lederach ──────────────────────────────────────────────────────────
  {
    id: "lederach",
    name: "Conflict Transformation",
    shortName: "Lederach",
    authors: ["John Paul Lederach"],
    year: 1997,
    seminalWork: "Building Peace: Sustainable Reconciliation in Divided Societies (1997)",
    category: "transformation",
    corePrinciples: [
      "Transformation, not just resolution — seek constructive change in relationships, structures, and culture",
      "Four dimensions: personal, relational, structural, and cultural levels must all be addressed",
      "Moral imagination — the capacity to imagine and create something that doesn't yet exist in relationships",
      "Time is long — sustainable peace requires generational thinking, not just immediate settlement",
      "Conflict is natural — not pathological; it carries the seeds of constructive change",
    ],
    keyTechniques: [
      {
        name: "Elicitive Facilitation",
        description:
          "Draw on the cultural resources and wisdom already present within the conflicting community rather than importing external models.",
        whenToUse:
          "Community and inter-group conflicts with cultural complexity.",
      },
      {
        name: "Nested Paradigm Analysis",
        description:
          "Map conflict at immediate (episode), ongoing (epicenter), and contextual (meta) levels to understand root causes.",
        whenToUse:
          "When surface disputes are symptoms of deeper structural or cultural issues.",
      },
      {
        name: "Relationship Rebuilding",
        description:
          "Deliberately create opportunities for humanizing contact between parties at all social levels.",
        whenToUse:
          "Post-agreement phase; community disputes where ongoing relationships matter.",
      },
      {
        name: "Conflict Mapping",
        description:
          "Visual diagram of actors, relationships, issues, dynamics, and history to reveal the full conflict ecosystem.",
        whenToUse: "Initial assessment of complex multi-party conflicts.",
      },
    ],
    diagnosticQuestions: [
      "What underlying structural injustice or inequality is this conflict expressing?",
      "How has this conflict affected relationships, identity, and community?",
      "What cultural resources or traditions could support peacebuilding here?",
      "What would a transformed (not just resolved) relationship between parties look like?",
      "Who are the mid-level leaders that could sustain peace work long-term?",
    ],
    bestFor: [
      "Protracted community and inter-group conflicts",
      "Post-conflict reconciliation",
      "Identity-based and values-based disputes",
      "Conflicts with structural power imbalances",
      "Situations requiring long-term relationship change",
    ],
    limitations: [
      "Slower than settlement-focused approaches — not suited to urgent disputes",
      "Requires deep contextual knowledge and cultural competence",
      "Less suited to purely commercial or transactional conflicts",
    ],
    glaslStages: "4-9",
    tacitusPrimitives: ["Narrative", "Event", "Actor", "Constraint"],
  },

  // ── 4. Glasl ─────────────────────────────────────────────────────────────
  {
    id: "glasl",
    name: "9-Stage Conflict Escalation Model",
    shortName: "Glasl",
    authors: ["Friedrich Glasl"],
    year: 1982,
    seminalWork: "Confronting Conflict: A First-Aid Kit for Handling Conflict (1999 English ed.)",
    category: "escalation",
    corePrinciples: [
      "Escalation is a predictable, stage-based process with 9 identifiable levels",
      "Stages 1–3 (Win-Win): Hardening, Debate, Actions — self-help still possible",
      "Stages 4–6 (Win-Lose): Coalitions, Loss of Face, Strategies of Threat — third-party needed",
      "Stages 7–9 (Lose-Lose): Limited destruction, fragmentation, together into the abyss",
      "Each stage requires a different intervention type — one size does not fit all",
    ],
    keyTechniques: [
      {
        name: "Escalation Diagnosis",
        description:
          "Identify the current stage using behavioral indicators: imagery, communication, coalitions, threats.",
        whenToUse: "At intake and at each phase transition in mediation.",
      },
      {
        name: "Stage-Matched Intervention",
        description:
          "Apply moderation (1–3), mediation (4–5), arbitration/conciliation (6), power intervention (7–9).",
        whenToUse: "After diagnosis of escalation stage.",
      },
      {
        name: "De-escalation Ladder",
        description:
          "Structured steps to bring a conflict down one or two stages before attempting resolution.",
        whenToUse:
          "When parties are too adversarial for interest-based work.",
      },
      {
        name: "Coalition Analysis",
        description:
          "Map third-party alliances that are fueling escalation and plan to neutralize them.",
        whenToUse: "Stage 4+ when coalitions have formed.",
      },
    ],
    diagnosticQuestions: [
      "Have the parties stopped talking and started acting against each other?",
      "Are third parties being recruited into alliances or coalitions?",
      "Has the conflict moved from disagreement to personal attacks on dignity?",
      "Are either party making threats they intend to carry out regardless of consequences?",
      "Is either party willing to accept mutual harm to damage the other?",
    ],
    bestFor: [
      "Diagnosing conflict severity and choosing intervention type",
      "Workplace and organizational conflicts",
      "Family and community disputes at any stage",
      "Training mediators in escalation dynamics",
    ],
    limitations: [
      "Descriptive, not prescriptive — tells you where you are, not exactly what to do",
      "Stage boundaries are fuzzy in real conflicts",
      "Cultural variation affects which behaviors indicate which stage",
    ],
    glaslStages: "all",
    tacitusPrimitives: ["Event", "Leverage", "Commitment", "Actor"],
  },

  // ── 5. Zartman ───────────────────────────────────────────────────────────
  {
    id: "zartman",
    name: "Ripeness Theory",
    shortName: "Zartman",
    authors: ["I. William Zartman"],
    year: 2000,
    seminalWork: "Ripe for Resolution: Conflict and Intervention in Africa (1989); Ripeness Theory revisited (2000)",
    category: "analysis",
    corePrinciples: [
      "Conflicts are ripe for resolution when both parties perceive a Mutually Hurting Stalemate (MHS)",
      "MHS: neither party can win; continuing the conflict costs more than settling",
      "Both parties must also perceive a Way Out — a vision of an acceptable settlement",
      "Ripeness is a window of opportunity, not a permanent state — must be seized",
      "Mediators can help create ripeness by raising costs of conflict or facilitating vision of resolution",
    ],
    keyTechniques: [
      {
        name: "MHS Assessment",
        description:
          "Evaluate whether each party genuinely perceives the status quo as painful and unsustainable.",
        whenToUse: "Before investing mediation resources; helps predict success probability.",
      },
      {
        name: "Way-Out Articulation",
        description:
          "Help parties envision a concrete, acceptable settlement scenario — not just an abstract hope.",
        whenToUse: "When parties acknowledge the conflict is costly but can't see an exit.",
      },
      {
        name: "Ripeness Engineering",
        description:
          "Mediator or third party raises costs of no-agreement through sanctions, deadlines, or changed incentives.",
        whenToUse: "When mediation is premature and ripeness must be cultivated.",
      },
      {
        name: "Timing Analysis",
        description:
          "Identify the moment when both parties are most ready to negotiate and move decisively.",
        whenToUse: "Strategic planning by mediators and sponsors.",
      },
    ],
    diagnosticQuestions: [
      "Does each party perceive the current situation as more costly than a negotiated settlement?",
      "Can both parties envision what a workable resolution would look like?",
      "What would have to change to make both parties feel the pain of the status quo?",
      "Is there a specific deadline or event that could create a ripe moment?",
      "Are there spoilers who benefit from continued conflict and will resist ripeness?",
    ],
    bestFor: [
      "Political and diplomatic conflicts",
      "Labor disputes and strikes",
      "Strategic timing of mediation entry",
      "Conflicts where parties are not yet ready to negotiate",
    ],
    limitations: [
      "Relies on perceptions, which are hard to measure objectively",
      "Waiting for ripeness may allow harm to continue",
      "Parties may misrepresent their pain levels strategically",
    ],
    glaslStages: "4-7",
    tacitusPrimitives: ["Leverage", "Constraint", "Commitment", "Interest"],
  },

  // ── 6. Bush & Folger ─────────────────────────────────────────────────────
  {
    id: "bush-folger",
    name: "Transformative Mediation",
    shortName: "Bush & Folger",
    authors: ["Robert A. Baruch Bush", "Joseph P. Folger"],
    year: 2005,
    seminalWork: "The Promise of Mediation: The Transformative Approach to Conflict (2005)",
    category: "transformation",
    corePrinciples: [
      "Empowerment: restoring each party's sense of capacity, confidence, and agency in the conflict",
      "Recognition: fostering genuine acknowledgment of the other party's perspective and humanity",
      "Conflict as opportunity: destructive interaction can be transformed into constructive engagement",
      "Party-directed process: the mediator follows, not leads — agenda and pace belong to the parties",
      "Micro-focus: transformative interventions occur moment-by-moment in the conversation, not at the outcome level",
    ],
    keyTechniques: [
      {
        name: "Empowerment Move",
        description:
          "Mediator reflects back a party's expressed uncertainty, decision, or strength to restore their agency.",
        whenToUse:
          "When a party feels powerless, confused, or overwhelmed by the conflict.",
      },
      {
        name: "Recognition Move",
        description:
          "Mediator highlights a moment of the party considering or acknowledging the other's perspective.",
        whenToUse:
          "When one party shows openness to the other's situation — catch and amplify it.",
      },
      {
        name: "Summarizing Shifts",
        description:
          "Mediator reflects the quality of interaction, noting when conversation has moved from destructive to constructive.",
        whenToUse: "Throughout the session to reinforce positive shifts.",
      },
      {
        name: "Following Leads",
        description:
          "Mediator tracks what matters to the party in the moment and follows that, rather than steering toward outcome.",
        whenToUse:
          "Throughout — core practice of transformative approach.",
      },
    ],
    diagnosticQuestions: [
      "Does either party feel voiceless, powerless, or overwhelmed in this conflict?",
      "Has either party shown any moment of considering the other's perspective, however brief?",
      "Is the quality of communication between parties destructive or constructive right now?",
      "What is each party's sense of agency in resolving this conflict?",
      "Are parties speaking to each other or only through the mediator?",
    ],
    bestFor: [
      "Workplace and employment disputes",
      "Divorce and family conflict",
      "Long-term relationship conflicts where relationship quality matters",
      "Community disputes",
      "Any conflict where empowerment and dignity are central",
    ],
    limitations: [
      "May not produce settlement efficiently — can frustrate parties seeking a quick deal",
      "Requires high skill to track micro-shifts without directing",
      "Less suited to commercial disputes where outcome is the only concern",
    ],
    glaslStages: "1-5",
    tacitusPrimitives: ["Narrative", "Interest", "Actor", "Claim"],
  },

  // ── 7. Winslade & Monk ───────────────────────────────────────────────────
  {
    id: "winslade-monk",
    name: "Narrative Mediation",
    shortName: "Winslade & Monk",
    authors: ["John Winslade", "Gerald Monk"],
    year: 2000,
    seminalWork: "Narrative Mediation: A New Approach to Conflict Resolution (2000)",
    category: "mediation",
    corePrinciples: [
      "Conflict is maintained by dominant, conflict-saturated stories parties tell about themselves and each other",
      "Externalizing the problem: the conflict is not the person — separate people from their problem-stories",
      "Deconstruction: question the assumptions, power relations, and cultural contexts embedded in conflict narratives",
      "Alternative storylines: help parties construct new, collaborative accounts of their relationship",
      "Unique outcomes: moments that contradict the dominant conflict story are seeds of a new narrative",
    ],
    keyTechniques: [
      {
        name: "Externalizing Conversation",
        description:
          "Name the conflict as a separate entity ('the dispute about X') rather than a property of either party.",
        whenToUse:
          "When parties are stuck in blame cycles and identity-based accusations.",
      },
      {
        name: "Unique Outcome Elicitation",
        description:
          "Ask about times when the conflict didn't dominate — moments of cooperation, understanding, or respect.",
        whenToUse:
          "After establishing the dominant story; to build the alternative narrative.",
      },
      {
        name: "Deconstruction Questions",
        description:
          "Explore who benefits from the dominant narrative, whose voice is absent, and what cultural assumptions it carries.",
        whenToUse:
          "When the conflict story contains power imbalances or cultural stereotypes.",
      },
      {
        name: "Re-authoring",
        description:
          "Collaboratively write a new account of the relationship that incorporates the unique outcomes and the parties' preferred identities.",
        whenToUse:
          "Resolution phase; when parties are ready to build a new shared story.",
      },
    ],
    diagnosticQuestions: [
      "What story is each party telling about themselves and the other that maintains the conflict?",
      "Can the problem be named separately from either person's identity?",
      "Are there any times, however small, when the conflict story didn't hold true?",
      "Whose interests are served by the current dominant narrative?",
      "What preferred story would each party like to be able to tell about their relationship?",
    ],
    bestFor: [
      "Identity-based and deeply personal conflicts",
      "Community and neighbor disputes",
      "School and youth conflicts",
      "Conflicts with strong blame and victimhood narratives",
      "Culturally diverse mediation contexts",
    ],
    limitations: [
      "Can feel abstract to parties expecting practical problem-solving",
      "Takes more sessions than settlement-focused approaches",
      "Requires mediator fluency in narrative theory",
    ],
    glaslStages: "1-5",
    tacitusPrimitives: ["Narrative", "Actor", "Claim", "Event"],
  },

  // ── 8. Thomas-Kilmann ────────────────────────────────────────────────────
  {
    id: "thomas-kilmann",
    name: "Conflict Mode Instrument",
    shortName: "Thomas-Kilmann",
    authors: ["Kenneth Thomas", "Ralph Kilmann"],
    year: 1974,
    seminalWork: "Thomas-Kilmann Conflict Mode Instrument (1974)",
    category: "psychology",
    corePrinciples: [
      "Five conflict styles defined by two dimensions: assertiveness (own concerns) and cooperativeness (others' concerns)",
      "Competing: high assertiveness, low cooperation — win-lose orientation",
      "Collaborating: high assertiveness, high cooperation — win-win problem-solving",
      "Compromising: mid assertiveness, mid cooperation — split the difference",
      "Avoiding: low assertiveness, low cooperation — withdraw or defer",
      "Accommodating: low assertiveness, high cooperation — yield to the other",
    ],
    keyTechniques: [
      {
        name: "Style Diagnosis",
        description:
          "Identify each party's dominant conflict style through observation of their communication patterns and stated preferences.",
        whenToUse:
          "During Discovery phase; informs how to frame questions and interventions.",
      },
      {
        name: "Style Mismatch Resolution",
        description:
          "When parties use incompatible styles (e.g., Competing vs. Avoiding), help the Avoider articulate needs and the Competitor slow down.",
        whenToUse:
          "When communication patterns create persistent power imbalance.",
      },
      {
        name: "Style Flex Coaching",
        description:
          "Help parties understand their non-dominant styles and when to use them strategically.",
        whenToUse:
          "Skill-building sessions; post-conflict coaching.",
      },
    ],
    diagnosticQuestions: [
      "Does one party consistently push hard while the other withdraws?",
      "Is either party splitting differences without exploring underlying interests?",
      "Does one party consistently yield, and is that sustainable?",
      "What conflict styles have the parties used historically in this relationship?",
      "Is the dominant party's assertiveness matched by genuine problem-solving or is it positional?",
    ],
    bestFor: [
      "Organizational and team conflicts",
      "Diagnosing communication patterns",
      "Coaching disputants in constructive engagement",
      "Understanding why previous resolution attempts failed",
    ],
    limitations: [
      "Descriptive tool, not a resolution framework on its own",
      "Self-report bias — parties may not accurately identify their style",
      "Cultural variation affects what constitutes 'assertive' or 'cooperative'",
    ],
    glaslStages: "1-4",
    tacitusPrimitives: ["Actor", "Interest", "Claim"],
  },

  // ── 9. Gottman ───────────────────────────────────────────────────────────
  {
    id: "gottman",
    name: "Four Horsemen of Conflict",
    shortName: "Gottman",
    authors: ["John Gottman"],
    year: 1994,
    seminalWork: "Why Marriages Succeed or Fail (1994)",
    category: "psychology",
    corePrinciples: [
      "Four behaviors predict relationship deterioration: Criticism, Contempt, Defensiveness, and Stonewalling",
      "Criticism attacks the person, not the behavior — 'You always' vs. 'I felt hurt when'",
      "Contempt communicates superiority, disgust, and disrespect — the most destructive of the four",
      "Defensiveness deflects responsibility and escalates attacks — counterattack or victim stance",
      "Stonewalling shuts down communication — emotional overwhelm triggers withdrawal",
      "Antidotes: Gentle start-up, building culture of appreciation, taking responsibility, physiological self-soothing",
    ],
    keyTechniques: [
      {
        name: "Horseman Detection",
        description:
          "Identify which of the four destructive communication patterns is present in the conflict interaction.",
        whenToUse: "Real-time during joint sessions; in analysis of past interactions.",
      },
      {
        name: "Gentle Start-Up",
        description:
          "Teach parties to raise concerns with 'I feel… about… I need…' rather than 'You always/never…'",
        whenToUse: "When criticism is derailing productive conversation.",
      },
      {
        name: "Physiological Soothing",
        description:
          "Call a time-out when either party shows signs of emotional flooding (heart rate >100 BPM); resume after 20 minutes.",
        whenToUse: "When stonewalling or contempt appears; de-escalation protocol.",
      },
      {
        name: "Appreciation Building",
        description:
          "Invite parties to identify specific things they value about the other — antidote to contempt.",
        whenToUse: "Early in relationship-focused mediation; trust-building phase.",
      },
    ],
    diagnosticQuestions: [
      "Are criticisms targeting the other party's behavior or character?",
      "Is there any contempt — eye-rolling, sarcasm, mockery — in how parties speak about each other?",
      "Does either party respond to critique with counter-attack or victim stance rather than taking responsibility?",
      "Is either party shutting down, going silent, or physically withdrawing from the conversation?",
      "Can either party name specific things they appreciate about the other person?",
    ],
    bestFor: [
      "Relationship and couples conflicts",
      "Family disputes",
      "Long-term business partnerships in distress",
      "Workplace relationships with personal dimension",
    ],
    limitations: [
      "Developed primarily in couples context — generalizes imperfectly to non-intimate conflicts",
      "Cultural variation in what constitutes contempt or appropriate emotional expression",
    ],
    glaslStages: "2-6",
    tacitusPrimitives: ["Narrative", "Actor", "Event", "Interest"],
  },

  // ── 10. Moore ────────────────────────────────────────────────────────────
  {
    id: "moore",
    name: "Circle of Conflict",
    shortName: "Moore",
    authors: ["Christopher W. Moore"],
    year: 2014,
    seminalWork: "The Mediation Process: Practical Strategies for Resolving Conflict, 4th ed. (2014)",
    category: "analysis",
    corePrinciples: [
      "Conflicts have five root causes that require different intervention strategies",
      "Relationship conflicts: strong emotions, misperceptions, poor communication",
      "Data conflicts: lack of information, different information, different interpretation",
      "Interest conflicts: substantive, procedural, and psychological interests at stake",
      "Structural conflicts: unequal power, geographic constraints, time pressures",
      "Value conflicts: different criteria for evaluating behavior or policy",
    ],
    keyTechniques: [
      {
        name: "Conflict Cause Diagnosis",
        description:
          "Classify the conflict's primary causes across the five categories to select targeted interventions.",
        whenToUse: "Initial assessment; whenever progress stalls.",
      },
      {
        name: "Data Reconciliation",
        description:
          "Jointly establish agreed facts, commission shared expert assessment, or distinguish facts from interpretations.",
        whenToUse: "When parties disagree about what happened.",
      },
      {
        name: "Structural Redesign",
        description:
          "Address systemic causes — change decision processes, timelines, or resource allocation.",
        whenToUse: "When the conflict is maintained by structural conditions, not just communication.",
      },
      {
        name: "Interest Mapping",
        description:
          "Separately map substantive (what), procedural (how), and psychological (status, respect) interests for each party.",
        whenToUse:
          "Discovery phase; Interest conflicts specifically.",
      },
    ],
    diagnosticQuestions: [
      "Is this conflict primarily about facts, interests, values, relationships, or structure?",
      "Do parties have different information, or different interpretations of the same information?",
      "Are there power imbalances or structural constraints driving the conflict?",
      "Is the conflict about what the parties want, or about how they want to be treated?",
      "Do the parties hold fundamentally different values about right and wrong in this situation?",
    ],
    bestFor: [
      "Complex multi-causal conflicts",
      "Organizational change conflicts",
      "Policy disputes",
      "Initial conflict assessment and triage",
    ],
    limitations: [
      "Diagnostic framework, not a full resolution methodology",
      "Categories can overlap in real conflicts",
    ],
    glaslStages: "all",
    tacitusPrimitives: ["Interest", "Constraint", "Narrative", "Event", "Claim"],
  },

  // ── 11. Mayer ────────────────────────────────────────────────────────────
  {
    id: "mayer",
    name: "Wheel of Conflict",
    shortName: "Mayer",
    authors: ["Bernard Mayer"],
    year: 2012,
    seminalWork: "The Dynamics of Conflict: A Guide to Engagement and Intervention (2012)",
    category: "analysis",
    corePrinciples: [
      "Conflict has three interconnected dimensions: cognitive (perceptions), emotional (feelings), and behavioral (actions)",
      "All three dimensions must be addressed for lasting resolution",
      "Conflict engagement is not always about resolution — sometimes endurance or avoidance is appropriate",
      "The Wheel of Conflict: needs, values, communication, emotions, history, and structure are the hub of all conflicts",
      "Conflict professionals must work with parties' readiness to engage, not impose resolution",
    ],
    keyTechniques: [
      {
        name: "Three-Dimensional Assessment",
        description:
          "Evaluate the cognitive, emotional, and behavioral dimensions separately to understand what's driving the conflict.",
        whenToUse: "Initial assessment; after impasse.",
      },
      {
        name: "Readiness Assessment",
        description:
          "Evaluate each party's readiness to engage in the resolution process before committing to joint sessions.",
        whenToUse: "Pre-mediation; when parties seem reluctant.",
      },
      {
        name: "Needs-Based Reframing",
        description:
          "Connect all stated positions and behaviors back to underlying human needs (security, recognition, autonomy, etc.).",
        whenToUse: "Throughout; when positional arguments feel intractable.",
      },
    ],
    diagnosticQuestions: [
      "What is each party thinking (cognitive), feeling (emotional), and doing (behavioral) in this conflict?",
      "What underlying needs — security, identity, belonging, autonomy — are not being met?",
      "How do the parties' histories with each other and with conflict in general shape their current behavior?",
      "Is each party's emotional dimension acknowledged and safe, or is it driving behavior unconsciously?",
      "Are the parties ready to engage in resolution, or do they need more time or preparation?",
    ],
    bestFor: [
      "Complex interpersonal conflicts",
      "Pre-mediation assessment",
      "Workplace and family conflicts with strong emotional component",
      "Conflicts where previous resolution attempts have failed",
    ],
    limitations: [
      "Highly analytical — may overwhelm parties who want practical solutions",
      "Requires skilled facilitator to work all three dimensions simultaneously",
    ],
    glaslStages: "all",
    tacitusPrimitives: ["Interest", "Narrative", "Event", "Actor"],
  },

  // ── 12. Deutsch ──────────────────────────────────────────────────────────
  {
    id: "deutsch",
    name: "Cooperative vs. Competitive Conflict",
    shortName: "Deutsch",
    authors: ["Morton Deutsch"],
    year: 1973,
    seminalWork: "The Resolution of Conflict: Constructive and Destructive Processes (1973)",
    category: "analysis",
    corePrinciples: [
      "Deutsch's Crude Law: the processes and outcomes of conflict tend to resemble the processes used to begin it",
      "Cooperative orientation: parties see goals as positively linked — one's success helps the other",
      "Competitive orientation: parties see goals as negatively linked — one's gain is the other's loss",
      "Social interdependence theory: structure the relationship as cooperative to produce constructive conflict",
      "Destructive conflict enlarges scope, escalates intensity, and becomes independent of initial cause",
    ],
    keyTechniques: [
      {
        name: "Interdependence Reframing",
        description:
          "Demonstrate how parties' goals are actually positively linked, shifting competitive to cooperative framing.",
        whenToUse: "When parties are locked in zero-sum thinking.",
      },
      {
        name: "Superordinate Goal Construction",
        description:
          "Identify a shared goal that neither party can achieve alone, requiring cooperation to attain.",
        whenToUse: "Especially effective in multi-party and organizational conflicts.",
      },
      {
        name: "Trust Incrementalism",
        description:
          "Build cooperation through small, reciprocal, low-risk cooperative steps (GRIT strategy).",
        whenToUse:
          "When mutual distrust prevents engagement in joint problem-solving.",
      },
    ],
    diagnosticQuestions: [
      "Do the parties perceive their goals as mutually exclusive, or could both succeed simultaneously?",
      "Is there a shared threat or superordinate goal that could unite the parties?",
      "Has the conflict expanded beyond its original scope in scope or intensity?",
      "What level of trust, if any, exists between the parties?",
      "What would have to change for both parties to perceive their goals as positively linked?",
    ],
    bestFor: [
      "Team and organizational conflicts",
      "Repeated-interaction conflicts (neighbors, colleagues, business partners)",
      "Conflicts where zero-sum framing is preventing agreement",
    ],
    limitations: [
      "Assumes parties can be shifted to cooperative orientation — may not hold in deep value conflicts",
      "Academic/theoretical — requires translation to practitioner techniques",
    ],
    glaslStages: "1-5",
    tacitusPrimitives: ["Interest", "Leverage", "Commitment", "Constraint"],
  },

  // ── 13. Schelling ────────────────────────────────────────────────────────
  {
    id: "schelling",
    name: "Strategy of Conflict",
    shortName: "Schelling",
    authors: ["Thomas C. Schelling"],
    year: 1960,
    seminalWork: "The Strategy of Conflict (1960)",
    category: "negotiation",
    corePrinciples: [
      "Focal points (Schelling points): solutions parties converge on without explicit communication because they are salient",
      "Commitment tactics: binding yourself credibly to a course of action strengthens your negotiating position",
      "Threats and promises: credibility is everything — threats must be costly to carry out and still carried out",
      "Brinkmanship: deliberately raising the risk of mutual harm to extract concessions",
      "Communication is strategic: what you communicate, and to whom, is a game-theoretic decision",
    ],
    keyTechniques: [
      {
        name: "Focal Point Identification",
        description:
          "Identify salient, obvious, or precedent-based solutions that parties might independently converge on.",
        whenToUse:
          "When explicit negotiation is blocked; helps find natural landing zones.",
      },
      {
        name: "Commitment Analysis",
        description:
          "Assess how credible each party's commitments and threats are, and what would make them more or less credible.",
        whenToUse: "When parties are making strategic threats or concessions.",
      },
      {
        name: "Communication Channel Design",
        description:
          "Structure what information is shared, with whom, and when to optimize strategic outcomes.",
        whenToUse: "Multi-party negotiations; shuttle diplomacy contexts.",
      },
    ],
    diagnosticQuestions: [
      "Is there an obvious, precedent-based solution that both parties might independently see as fair?",
      "Are the parties' threats credible — do they have both the ability and the will to carry them out?",
      "Are parties making commitments that constrain their future options?",
      "Are there issues in this conflict that cannot be compromised because of commitment tactics?",
      "What information are parties strategically withholding or revealing?",
    ],
    bestFor: [
      "High-stakes political and diplomatic negotiations",
      "Labor-management disputes with credible threats",
      "Understanding strategic behavior in positional conflicts",
    ],
    limitations: [
      "Assumes rational strategic actors — breaks down in emotional or irrational conflicts",
      "Escalation risk: brinkmanship can backfire catastrophically",
      "Less suited to relationship-focused mediation",
    ],
    glaslStages: "4-7",
    tacitusPrimitives: ["Leverage", "Commitment", "Claim"],
  },

  // ── 14. Pruitt & Kim ─────────────────────────────────────────────────────
  {
    id: "pruitt-kim",
    name: "Dual Concern Model",
    shortName: "Pruitt & Kim",
    authors: ["Dean Pruitt", "Sung Hee Kim"],
    year: 2004,
    seminalWork: "Social Conflict: Escalation, Stalemate, and Settlement (2004)",
    category: "negotiation",
    corePrinciples: [
      "Negotiation strategy is determined by two concerns: concern for own outcomes and concern for other's outcomes",
      "Four strategies: Contending (high self, low other), Problem-Solving (high both), Yielding (low self, high other), Inaction (low both)",
      "Problem-solving produces the best joint outcomes when both parties engage in it",
      "Escalation follows a specific sequence: contentious tactics → resistance → more contentious tactics",
      "Stalemate creates the condition for de-escalation and settlement",
    ],
    keyTechniques: [
      {
        name: "Dual Concern Mapping",
        description:
          "Assess each party's concern for their own outcome vs. concern for the relationship/other party's outcome.",
        whenToUse: "Assessment phase; strategy selection.",
      },
      {
        name: "Problem-Solving Invitation",
        description:
          "Shift parties from contending to problem-solving by explicitly reframing the task as joint problem-solving.",
        whenToUse:
          "When both parties are in contending mode; requires both to shift simultaneously.",
      },
      {
        name: "Escalation Pattern Analysis",
        description:
          "Trace the escalation sequence to identify the original trigger and earliest intervention point.",
        whenToUse: "Historical analysis; understanding conflict genesis.",
      },
    ],
    diagnosticQuestions: [
      "How much does each party care about the relationship vs. the immediate outcome?",
      "Is either party currently in contending mode — pushing hard for their own position?",
      "What triggered the escalation sequence that brought the conflict to its current level?",
      "Has the conflict reached stalemate — can either party win?",
      "What would need to be true for both parties to shift to problem-solving mode?",
    ],
    bestFor: [
      "Organizational and workplace conflicts",
      "Understanding negotiation strategy choices",
      "Predicting escalation patterns",
    ],
    limitations: [
      "Dual concern is a simplification — real motivations are more complex",
      "Problem-solving requires both parties to shift — one-sided shift leads to exploitation",
    ],
    glaslStages: "1-5",
    tacitusPrimitives: ["Interest", "Leverage", "Claim", "Constraint"],
  },

  // ── 15. Galtung ──────────────────────────────────────────────────────────
  {
    id: "galtung",
    name: "Structural Violence & Conflict Triangle",
    shortName: "Galtung",
    authors: ["Johan Galtung"],
    year: 1996,
    seminalWork: "Peace by Peaceful Means: Peace and Conflict, Development and Civilization (1996)",
    category: "transformation",
    corePrinciples: [
      "Conflict triangle: Attitudes (A), Behavior (B), Contradiction (C) — all three must be addressed",
      "Direct violence is visible; structural violence is built into social systems and institutions",
      "Cultural violence legitimizes direct and structural violence through ideology, religion, art, or science",
      "Positive peace is not merely the absence of war but the presence of justice and wellbeing",
      "TRANSCEND method: go beyond the conflict, not around it — creative transcendence of the contradiction",
    ],
    keyTechniques: [
      {
        name: "ABC Analysis",
        description:
          "Map the Attitude (perceptions, emotions, motivations), Behavior (verbal, physical), and Contradiction (incompatible goals or interests) dimensions.",
        whenToUse: "Structural analysis of deep or protracted conflicts.",
      },
      {
        name: "TRANSCEND Method",
        description:
          "Explore creative solutions that transcend the apparent contradiction, going beyond the zero-sum framing.",
        whenToUse:
          "When parties are locked in incompatible goal structures.",
      },
      {
        name: "Structural Analysis",
        description:
          "Identify systemic inequalities, power imbalances, and institutional arrangements that perpetuate the conflict.",
        whenToUse: "Community, political, and organizational conflicts with structural roots.",
      },
    ],
    diagnosticQuestions: [
      "Are there structural inequalities or power imbalances that make this conflict recurrent?",
      "What attitudes (prejudices, stereotypes, fears) are sustaining the conflict beyond the immediate issue?",
      "Is there a creative solution that makes the underlying contradiction disappear, rather than splitting it?",
      "What forms of cultural legitimization — narratives, ideologies — are justifying the conflict?",
      "What would positive peace — not just settlement — look like in this context?",
    ],
    bestFor: [
      "Community and inter-group conflicts",
      "Politically or structurally rooted disputes",
      "Post-conflict peacebuilding",
      "Environmental and resource conflicts",
    ],
    limitations: [
      "Very broad — requires translating theory to concrete intervention",
      "May overwhelm disputants who want practical solutions",
      "Not suited to time-pressured commercial disputes",
    ],
    glaslStages: "5-9",
    tacitusPrimitives: ["Narrative", "Constraint", "Actor", "Event"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PRACTICAL TECHNIQUE COLLECTIONS
  // ══════════════════════════════════════════════════════════════════════════

  // ── 16. BATNA Analysis Protocol ──────────────────────────────────────────
  {
    id: "batna-protocol",
    name: "BATNA Analysis Protocol",
    shortName: "BATNA Protocol",
    authors: ["Fisher & Ury", "CONCORDIA"],
    year: 1981,
    seminalWork: "Getting to Yes (1981) — extended by CONCORDIA practice",
    category: "negotiation",
    corePrinciples: [
      "BATNA = Best Alternative To a Negotiated Agreement — your walk-away option",
      "The stronger your BATNA, the less you need the negotiation to succeed",
      "Know your BATNA, improve your BATNA, and understand the other party's BATNA",
      "ZOPA (Zone of Possible Agreement) exists between each party's reservation price",
      "Your reservation price = the worst deal you'd accept before walking away to your BATNA",
    ],
    keyTechniques: [
      {
        name: "BATNA Inventory",
        description:
          "List all realistic alternatives if no deal is reached; evaluate each on key criteria.",
        whenToUse: "Pre-negotiation preparation; whenever impasse is threatened.",
      },
      {
        name: "BATNA Improvement",
        description:
          "Actively develop alternatives before and during negotiation to strengthen your position.",
        whenToUse: "Preparation phase; when the other party holds strong power.",
      },
      {
        name: "BATNA Reality Check",
        description:
          "Question whether each party's perceived BATNA is actually as strong as they believe.",
        whenToUse:
          "When parties refuse to engage because they overestimate their alternatives.",
      },
      {
        name: "ZOPA Mapping",
        description:
          "Estimate each party's reservation price and identify whether an overlap zone exists.",
        whenToUse:
          "Before making or evaluating proposals; reality-testing feasibility.",
      },
      {
        name: "Other's BATNA Analysis",
        description:
          "Systematically think through what happens to the other party if negotiations fail.",
        whenToUse:
          "Strategy development; understanding their pressure to settle.",
      },
    ],
    diagnosticQuestions: [
      "What will each party actually do if this negotiation fails?",
      "How good is each party's best alternative, really?",
      "Is there a zone of possible agreement between the parties' reservation prices?",
      "What would strengthen either party's BATNA, and at what cost?",
      "Is either party negotiating because they have no good alternative (weak BATNA)?",
    ],
    bestFor: [
      "Any negotiation",
      "Pre-mediation preparation",
      "Reality-testing parties' willingness to settle",
    ],
    limitations: [
      "Assumes parties can rationally evaluate alternatives",
      "Emotional attachment may override BATNA logic",
    ],
    glaslStages: "1-5",
    tacitusPrimitives: ["Leverage", "Constraint", "Interest", "Commitment"],
  },

  // ── 17. Active Listening Toolkit ─────────────────────────────────────────
  {
    id: "active-listening",
    name: "Active Listening Toolkit",
    shortName: "Active Listening",
    authors: ["Carl Rogers", "Thomas Gordon", "Robert Bolton"],
    year: 1980,
    seminalWork: "People Skills (Bolton, 1979); Client-Centered Therapy (Rogers, 1951)",
    category: "mediation",
    corePrinciples: [
      "Listening is an active skill, not passive reception — requires full attention and visible engagement",
      "Paraphrasing confirms understanding and shows the speaker they've been heard",
      "Emotional labeling names the feeling beneath the words — bridges thinking and feeling",
      "Mirroring repeats key words to encourage elaboration without directing content",
      "Summarizing synthesizes multiple points to create shared understanding and signal completeness",
    ],
    keyTechniques: [
      {
        name: "Mirroring",
        description:
          "Repeat the last few words of what was said with a slight upward inflection, inviting the speaker to continue.",
        whenToUse: "Whenever a party stops speaking and needs encouragement to go deeper.",
      },
      {
        name: "Paraphrasing",
        description:
          "Restate the speaker's content in your own words: 'So what I'm hearing is that...'",
        whenToUse:
          "After complex statements; to confirm understanding; to signal attention.",
      },
      {
        name: "Emotional Labeling",
        description:
          "Name the emotion you sense beneath the words: 'It sounds like you're feeling... is that right?'",
        whenToUse:
          "When emotional subtext is driving the conversation; to validate feeling before addressing content.",
      },
      {
        name: "Summarizing",
        description:
          "Pull together multiple statements into a coherent summary: 'Let me make sure I understand — your key concerns are X, Y, and Z.'",
        whenToUse:
          "After each party's opening statement; at phase transitions; when the mediator needs to shift focus.",
      },
      {
        name: "Open Questions",
        description:
          "Ask questions that cannot be answered yes/no: 'What happened next?', 'How did that affect you?', 'What matters most to you about this?'",
        whenToUse: "Throughout Discovery phase; whenever parties give thin or guarded responses.",
      },
    ],
    diagnosticQuestions: [
      "Does each party feel genuinely heard, or do they keep repeating the same points?",
      "Are emotional dimensions of the conflict being named and acknowledged?",
      "Is the mediator talking too much — are parties given sufficient space to speak?",
      "Are questions opening up exploration or closing it down?",
    ],
    bestFor: [
      "All mediation styles and contexts",
      "High-emotion conflicts requiring validation",
      "Situations where parties feel dismissed or misunderstood",
    ],
    limitations: [
      "Can feel artificial if overused",
      "Paraphrasing errors can feel invalidating if the party's meaning is distorted",
    ],
    glaslStages: "all",
    tacitusPrimitives: ["Narrative", "Interest", "Actor"],
  },

  // ── 18. Reframing Techniques ─────────────────────────────────────────────
  {
    id: "reframing",
    name: "Reframing Techniques",
    shortName: "Reframing",
    authors: ["Fisher & Ury", "Winslade & Monk", "CONCORDIA"],
    year: 1990,
    seminalWork: "Getting to Yes (1981); Narrative Mediation (2000)",
    category: "mediation",
    corePrinciples: [
      "Reframing changes the conceptual frame around a statement without changing the underlying facts",
      "Position → Interest: transform 'I want X' into 'You need X because of Y'",
      "Blame → Contribution: shift from 'you caused this' to 'how did we both contribute to this situation?'",
      "Past → Future: redirect from 'what happened' to 'what do we want going forward?'",
      "Problem → Challenge: name the issue as a shared problem to solve together, not a battle to win",
    ],
    keyTechniques: [
      {
        name: "Position-to-Interest Reframe",
        description:
          "Convert stated demands into underlying interests: 'It sounds like what you really need here is...'",
        whenToUse: "Whenever parties state positions rather than interests.",
      },
      {
        name: "Blame-to-Contribution Reframe",
        description:
          "Replace 'who caused this?' with 'how did this situation develop, and what role did each party play?'",
        whenToUse: "When blame language is blocking forward movement.",
      },
      {
        name: "Past-to-Future Reframe",
        description:
          "Acknowledge the past briefly, then pivot: 'Given what's happened, what would need to be true going forward for this to work?'",
        whenToUse: "When parties are stuck in historical grievances.",
      },
      {
        name: "Negative-to-Positive Reframe",
        description:
          "Translate attack language into constructive concern: 'They're irresponsible' → 'You need reliability from them.'",
        whenToUse: "When parties are characterizing each other negatively.",
      },
      {
        name: "Problem Externalization",
        description:
          "Name the problem separately from the parties: 'The communication breakdown between you' rather than 'your poor communication.'",
        whenToUse: "When parties are conflating person and problem.",
      },
    ],
    diagnosticQuestions: [
      "Are parties articulating positions or interests?",
      "Is blame language preventing forward movement?",
      "Are the parties focused on the past or can they be oriented to the future?",
      "How could the problem be named in a way that is neutral to both parties?",
    ],
    bestFor: [
      "All mediation phases, especially Discovery and Exploration",
      "Breaking positional deadlocks",
      "De-escalating blame cycles",
    ],
    limitations: [
      "Reframes that feel forced or inaccurate will lose parties' trust",
      "Cannot reframe away genuine injustice — some things require acknowledgment, not reframing",
    ],
    glaslStages: "1-5",
    tacitusPrimitives: ["Claim", "Interest", "Narrative"],
  },

  // ── 19. Power Balancing Methods ──────────────────────────────────────────
  {
    id: "power-balancing",
    name: "Power Balancing Methods",
    shortName: "Power Balancing",
    authors: ["Haynes", "Moore", "Mayer"],
    year: 1993,
    seminalWork: "Mediation Divorce (Haynes, 1993); The Mediation Process (Moore, 2014)",
    category: "mediation",
    corePrinciples: [
      "Power imbalance undermines the integrity and sustainability of mediated agreements",
      "Power exists across multiple dimensions: informational, structural, social, emotional, resource-based",
      "Mediator's role: not to equalize power but to ensure each party can participate meaningfully",
      "Empowerment strategies: information provision, caucusing, process safeguards, separate preparation",
      "Caucusing (private sessions) allows confidential power assessment and skill building",
    ],
    keyTechniques: [
      {
        name: "Power Mapping",
        description:
          "Assess each party's power across key dimensions: BATNA strength, information, social support, institutional authority, emotional regulation.",
        whenToUse: "Pre-mediation assessment; whenever the process feels unbalanced.",
      },
      {
        name: "Caucusing",
        description:
          "Hold separate private sessions with each party to confidentially surface needs, fears, and constraints without loss of face.",
        whenToUse:
          "When power imbalance, domestic violence concerns, or face-saving needs are present.",
      },
      {
        name: "Information Equalization",
        description:
          "Ensure all parties have access to relevant facts, legal rights, market data, and expert opinion.",
        whenToUse:
          "When one party has information asymmetry that advantages them unfairly.",
      },
      {
        name: "Process Safeguards",
        description:
          "Structure the process to prevent interruption, domination, or intimidation: ground rules, turn-taking, time allocation.",
        whenToUse: "Opening session; whenever dominant party behavior emerges.",
      },
      {
        name: "Referral Protocol",
        description:
          "Recognize when power imbalance is so severe (domestic violence, coercion) that mediation is inappropriate and refer to other resources.",
        whenToUse: "Pre-mediation screening; any time safety concerns arise.",
      },
    ],
    diagnosticQuestions: [
      "Is there a significant power differential between parties in terms of resources, information, or status?",
      "Is one party dominating the joint session — talking over, intimidating, or silencing the other?",
      "Does either party feel unable to speak freely in the presence of the other?",
      "Is there a history of coercion, abuse, or control between these parties?",
      "What process structures would help ensure both parties can participate meaningfully?",
    ],
    bestFor: [
      "Any conflict with significant power differential",
      "Workplace disputes (employer-employee)",
      "Domestic and family mediation",
      "Situations with institutional power asymmetry",
    ],
    limitations: [
      "Some power imbalances are too severe for mediation to be appropriate",
      "Interventions to balance power may be perceived as taking sides",
    ],
    glaslStages: "all",
    tacitusPrimitives: ["Leverage", "Constraint", "Actor", "Interest"],
  },

  // ── 20. De-escalation Playbook ───────────────────────────────────────────
  {
    id: "de-escalation",
    name: "De-escalation Playbook",
    shortName: "De-escalation",
    authors: ["Ury", "Glasl", "Patterson", "CONCORDIA"],
    year: 2000,
    seminalWork:
      "Getting Past No (Ury, 1991); Crucial Conversations (Patterson et al., 2002); Confronting Conflict (Glasl, 1999)",
    category: "mediation",
    corePrinciples: [
      "De-escalation precedes resolution — parties must be safe enough to engage before problem-solving can begin",
      "Acknowledge first: validate emotion before addressing content",
      "Lower the temperature with pacing, tone, and physical environment before addressing issues",
      "Name the cycle: surfacing the destructive pattern to both parties can interrupt it",
      "Agree on process before revisiting substance: shared rules create psychological safety",
    ],
    keyTechniques: [
      {
        name: "Emotional Validation",
        description:
          "Name and acknowledge the emotion without judgment: 'I can see this is very painful for you. That makes sense given what's happened.'",
        whenToUse:
          "Whenever a party is in emotional distress or feels unheard.",
      },
      {
        name: "Circuit Breaker",
        description:
          "Call a formal break when escalation is occurring: 'I'd like us to take a 10-minute break so we can all return to the table with fresh perspective.'",
        whenToUse:
          "When voices are raised, parties are interrupting each other, or contempt is appearing.",
      },
      {
        name: "Cycle Surfacing",
        description:
          "Name the destructive interaction pattern to both parties: 'I notice we've gotten into a cycle where X says Y and then Z happens — can we pause and look at that together?'",
        whenToUse:
          "When the same destructive pattern repeats in the session.",
      },
      {
        name: "Slow and Low",
        description:
          "Deliberately slow your own speech and lower your voice; parties tend to match the mediator's energy.",
        whenToUse: "Any time tension is rising in the room.",
      },
      {
        name: "Process Agreement Reset",
        description:
          "Return to and renegotiate ground rules when they've been violated, before returning to substance.",
        whenToUse:
          "After a significant breach of ground rules or process breakdown.",
      },
    ],
    diagnosticQuestions: [
      "Is either party in emotional flooding — unable to process information rationally?",
      "Is there a repeating destructive cycle in the interaction that can be named?",
      "Has the physical or social environment contributed to escalation?",
      "Do the parties feel safe enough to speak honestly with each other present?",
      "What has calmed tensions in past interactions between these parties?",
    ],
    bestFor: [
      "Any high-conflict mediation",
      "Glasl stages 3–6",
      "Situations where emotional intensity is preventing rational engagement",
      "Workplace and family conflicts with strong emotional components",
    ],
    limitations: [
      "Not a substitute for safety planning when genuine threat is present",
      "De-escalation without addressing underlying issues leads to temporary calm only",
    ],
    glaslStages: "2-7",
    tacitusPrimitives: ["Event", "Narrative", "Actor", "Interest"],
  },

  // ── 21. Adam Curle — Progression Model ──────────────────────────────────
  {
    id: "curle",
    name: "Conflict Progression Model",
    shortName: "Curle",
    authors: ["Adam Curle"],
    year: 1971,
    seminalWork: "Making Peace (1971)",
    category: "transformation",
    corePrinciples: [
      "Conflicts progress through four stages based on awareness and power balance",
      "Stage 1 — Latent: parties unaware of conflict or imbalance; needs EDUCATION",
      "Stage 2 — Confrontation: aware but power-imbalanced; needs ADVOCACY to equalize power",
      "Stage 3 — Negotiation: aware and roughly balanced; ready for MEDIATION",
      "Stage 4 — Sustainable Peace: resolved and maintained; needs ONGOING MAINTENANCE",
      "Mediation only works at Stage 3 — attempting it earlier fails or entrenches power imbalance",
    ],
    keyTechniques: [
      {
        name: "Readiness Assessment",
        description:
          "Evaluate both awareness of the conflict and power balance before choosing an intervention. Mediation is only appropriate when both are present.",
        whenToUse: "At intake; before recommending mediation as the appropriate intervention.",
      },
      {
        name: "Power Equalization",
        description:
          "Advocate for structural changes or coaching the less powerful party before bringing parties to the table.",
        whenToUse: "When one party is significantly less resourced, informed, or empowered than the other.",
      },
      {
        name: "Stage-Appropriate Intervention",
        description:
          "Match intervention type to conflict stage: education (Stage 1), advocacy (Stage 2), mediation (Stage 3), maintenance support (Stage 4).",
        whenToUse: "Any intake assessment; reassess at each phase transition.",
      },
    ],
    diagnosticQuestions: [
      "Are both parties aware this conflict exists and what it involves?",
      "Is there a significant power imbalance — legal, financial, informational — that should be addressed before mediation?",
      "Is mediation the right tool here, or do we need advocacy or education first?",
      "What would need to change for both parties to be genuinely ready to negotiate?",
      "If an agreement is reached, who will maintain it and prevent regression?",
    ],
    bestFor: [
      "Assessing readiness for mediation",
      "Power-imbalanced disputes (employer/employee, landlord/tenant)",
      "Community and structural conflicts",
      "Cases where one party is more legally or financially sophisticated",
    ],
    limitations: [
      "Requires honest assessment of power balance — can be uncomfortable to acknowledge",
      "Advocacy phase may not be neutral — can feel like taking sides",
      "Stage boundaries are not always clear-cut in practice",
    ],
    glaslStages: "1-6",
    tacitusPrimitives: ["Leverage", "Constraint", "Event"],
  },

  // ── 22. Peter Coleman — Intractable Conflicts ────────────────────────────
  {
    id: "coleman",
    name: "The Five Percent: Intractable Conflicts",
    shortName: "Coleman",
    authors: ["Peter T. Coleman"],
    year: 2011,
    seminalWork: "The Five Percent: Finding Solutions to Seemingly Impossible Conflicts (2011)",
    category: "analysis",
    corePrinciples: [
      "~5% of conflicts become self-perpetuating 'attractor states' where conflict is the stable equilibrium",
      "Attractor dynamics: feedback loops of grievance, narrative, and identity lock the conflict in place",
      "Traditional resolution tactics (compromise, dialogue) fail or backfire in attractor conflicts",
      "Required approach: PERTURBATION — disrupting the attractor landscape rather than negotiating within it",
      "Complexity-aware mediation: introduce novelty (new information, new actors, new framings) to destabilize the pattern",
    ],
    keyTechniques: [
      {
        name: "Attractor Mapping",
        description:
          "Identify the feedback loops maintaining the conflict: which narratives, identities, relationships, and grievances keep pulling parties back into conflict?",
        whenToUse: "When a conflict has persisted across multiple resolution attempts.",
      },
      {
        name: "Perturbation Strategy",
        description:
          "Introduce strategic disruptions: new information that challenges core narratives, new actors who reframe the conflict, or changed circumstances that alter cost-benefit calculus.",
        whenToUse: "When parties are deeply entrenched and conventional dialogue has failed repeatedly.",
      },
      {
        name: "Complexity Diagnosis",
        description:
          "Ask: 'Is this conflict simple (resolve it), complicated (expertise needed), or complex (emergent — need to perturb)?' Choose intervention type accordingly.",
        whenToUse: "At intake for long-running disputes; when prior mediation attempts have failed.",
      },
    ],
    diagnosticQuestions: [
      "Has this conflict become self-sustaining — does it persist even when circumstances change?",
      "What feedback loops maintain it? What keeps pulling parties back into conflict?",
      "Have previous resolution attempts failed or made things worse?",
      "What new information, actor, or framing could disrupt the current attractor?",
      "Is the goal here resolution, or destabilization of the conflict pattern?",
    ],
    bestFor: [
      "Long-running disputes that have resisted prior resolution",
      "Organizational conflicts where parties seem invested in the conflict itself",
      "Family feuds and deeply entrenched personal conflicts",
      "Identity-based conflicts with strong narrative lock-in",
    ],
    limitations: [
      "Requires deep diagnostic work before intervention can be designed",
      "Perturbation strategies carry risk of making things worse",
      "Not appropriate for simple or first-occurrence disputes",
    ],
    glaslStages: "4-9",
    tacitusPrimitives: ["Narrative", "Event", "Constraint", "Leverage"],
  },

  // ── 23. Ury/Brett/Goldberg — Interest-Rights-Power ──────────────────────
  {
    id: "ury-brett-goldberg",
    name: "Interest-Rights-Power Framework",
    shortName: "Ury/Brett/Goldberg",
    authors: ["William Ury", "Jeanne Brett", "Stephen Goldberg"],
    year: 1988,
    seminalWork: "Getting Disputes Resolved: Designing Systems to Cut the Costs of Conflict (1988)",
    category: "analysis",
    corePrinciples: [
      "Disputes can be resolved via three mechanisms: reconciling INTERESTS (cheapest, most durable), adjudicating RIGHTS (moderate cost), or exercising POWER (most costly, least durable)",
      "The escalation ladder: unresolved interests → rights contest → power struggle",
      "Good dispute systems build 'loop-back' procedures moving parties from power → rights → interests",
      "Prevention beats resolution: design systems that resolve disputes at the interest level before they escalate",
      "Cost of conflict has three components: transaction costs, satisfaction, and effects on the relationship",
    ],
    keyTechniques: [
      {
        name: "Mechanism Diagnosis",
        description:
          "Identify which mechanism parties are currently using: are they fighting with power, arguing rights, or exploring interests? The diagnosis determines the intervention.",
        whenToUse: "At intake and at any impasse; shapes the entire intervention strategy.",
      },
      {
        name: "Loop-Back Procedure",
        description:
          "When parties are in a rights or power contest, create a pathway back to interest-based dialogue before the expensive mechanism runs its course.",
        whenToUse: "When parties have escalated to litigation, arbitration, or coercive tactics.",
      },
      {
        name: "Dispute System Design",
        description:
          "For recurring disputes (organizational, labor-management), design a system with interest-based procedures as the first step, rights procedures as backup, and power procedures as last resort.",
        whenToUse: "Organizational mediation; designing HR or community dispute processes.",
      },
    ],
    diagnosticQuestions: [
      "Are parties currently fighting with power, arguing rights, or exploring interests?",
      "How do we loop them back toward interest-based dialogue?",
      "What is the total cost of this conflict — transaction costs, satisfaction, relationship damage?",
      "Is there a rights-based standard (law, contract, precedent) both parties would accept?",
      "If interests can't be reconciled, what rights procedure would be least costly and most legitimate?",
    ],
    bestFor: [
      "Organizational dispute system design",
      "Labor-management relations",
      "Recurring disputes in institutions",
      "Cases where parties have escalated to legal or coercive tactics",
    ],
    limitations: [
      "Requires parties to have some willingness to step back from the current mechanism",
      "Rights and power mechanisms sometimes produce durable outcomes (clear precedent, decisive power shift)",
      "Less applicable in purely interpersonal or emotional conflicts",
    ],
    glaslStages: "all",
    tacitusPrimitives: ["Leverage", "Interest", "Claim", "Commitment"],
  },

  // ── 24. Chris Argyris — Ladder of Inference ─────────────────────────────
  {
    id: "argyris",
    name: "Ladder of Inference",
    shortName: "Argyris",
    authors: ["Chris Argyris"],
    year: 1970,
    seminalWork: "Reasoning, Learning, and Action: Individual and Organizational (1982)",
    category: "psychology",
    corePrinciples: [
      "People climb an invisible 'ladder' from observable data → selected data → interpreted data → assumptions → conclusions → beliefs → actions",
      "We act on our conclusions as if they were facts, and rarely examine the inferential steps",
      "Conflicts often arise because parties are operating at different rungs of their respective ladders",
      "The reflexive loop: our beliefs filter which data we select, which reinforces those beliefs",
      "Walking back down the ladder — to shared observable facts — creates a foundation for genuine dialogue",
    ],
    keyTechniques: [
      {
        name: "Ladder Walk-Down",
        description:
          "Take a party from their conclusion back to the observable data: 'What did you actually see or hear that led you to that conclusion? What data are you drawing on?'",
        whenToUse: "When a party makes a sweeping judgment or attribution about the other.",
      },
      {
        name: "Assumption Surfacing",
        description:
          "Make implicit assumptions explicit: 'When you say they're acting in bad faith, what assumption is underneath that? What would have to be true for that to be accurate?'",
        whenToUse: "When parties have formed rigid beliefs about the other's motives or character.",
      },
      {
        name: "Data Selection Challenge",
        description:
          "Gently highlight the data the party may not be focusing on: 'That's an important data point. Are there other data points that might point in a different direction?'",
        whenToUse: "When confirmation bias is leading one party to cherry-pick evidence.",
      },
    ],
    diagnosticQuestions: [
      "At which rung of the ladder is each party operating — raw data, interpretation, assumption, or belief?",
      "Can both parties agree on the observable facts, even if they interpret them differently?",
      "What assumptions is each party making about the other's motives that may not be accurate?",
      "What data might each party be selectively ignoring that contradicts their current beliefs?",
      "If we walked both parties back to shared observable data, what would they agree on?",
    ],
    bestFor: [
      "Workplace misunderstandings and attribution errors",
      "Identity and character attacks",
      "Conflicts driven by misinterpreted intent",
      "Situations where parties have drawn firm conclusions from limited data",
    ],
    limitations: [
      "Requires parties to be willing to examine their own reasoning — high defensiveness resistance",
      "Walking down the ladder can feel invalidating if done clumsily",
      "Some conclusions are accurate — not all inferences are errors",
    ],
    glaslStages: "1-4",
    tacitusPrimitives: ["Narrative", "Claim", "Event"],
  },

  // ── 25. Rosenberg NVC ────────────────────────────────────────────────────
  {
    id: "rosenberg-nvc",
    name: "Nonviolent Communication (NVC)",
    shortName: "Rosenberg NVC",
    authors: ["Marshall B. Rosenberg"],
    year: 1999,
    seminalWork: "Nonviolent Communication: A Language of Life (1999)",
    category: "mediation",
    corePrinciples: [
      "Observation without evaluation — describe what happened factually, without interpreting or judging",
      "Feelings — identify and name the specific emotion (not 'I feel that you...' which is a thought, but 'I feel frustrated' which is an emotion)",
      "Needs — every feeling connects to a universal human need (autonomy, respect, safety, belonging, fairness, meaning)",
      "Requests — make specific, doable, positive requests (what you want, not what you don't want)",
      "Empathic listening — reflect back the other person's observations, feelings, needs, and requests before responding with your own",
    ],
    keyTechniques: [
      {
        name: "OFNR Sequence",
        description: "Observation → Feeling → Need → Request. Guide each party through this four-step structure to express themselves without blame.",
        whenToUse: "When parties use blame language, 'you always/never' statements, or character attacks",
      },
      {
        name: "Needs Translation",
        description: "Translate positions and demands into underlying universal needs. 'I want you fired' → 'I need to feel safe at work'",
        whenToUse: "When parties state rigid positions — always dig for the need underneath",
      },
      {
        name: "Enemy Image Dissolution",
        description: "Help parties see the other as a human with needs rather than as an adversary. Ask: 'What need of theirs do you think they're trying to meet?'",
        whenToUse: "When dehumanization or demonization is present",
      },
      {
        name: "Empathy Before Education",
        description: "Never give advice or solutions until the person feels fully heard. Reflect their feelings and needs first, repeatedly if needed.",
        whenToUse: "Always — especially when a party is flooded or defensive",
      },
      {
        name: "Self-Empathy Pause",
        description: "When the mediator feels triggered or stuck, internally apply OFNR to yourself: What am I observing? What am I feeling? What do I need? What do I request of myself?",
        whenToUse: "When you as mediator feel reactive or lost",
      },
    ],
    diagnosticQuestions: [
      "Are parties expressing feelings or judgments? (e.g., 'I feel abandoned' vs 'I feel that you don't care' — the second is a judgment)",
      "Can each party name the specific need behind their demand?",
      "Are requests specific and doable, or vague and open-ended?",
      "Has each party been heard empathically before being asked to move?",
    ],
    bestFor: [
      "Interpersonal conflicts",
      "workplace disputes involving blame/criticism",
      "family mediation",
      "any conflict where emotional language dominates",
      "cross-cultural disputes",
    ],
    limitations: [
      "Can feel formulaic if applied mechanically",
      "Requires genuine empathy, not just technique",
      "Less effective when power dynamics are extreme",
      "Not designed for structural/systemic conflicts",
    ],
    glaslStages: "1-5",
    tacitusPrimitives: ["Interest", "Narrative", "Claim"],
  },

  // ── 26. Stone, Patton & Heen — Difficult Conversations ───────────────────
  {
    id: "stone-difficult-conversations",
    name: "Difficult Conversations: The Three Conversations Model",
    shortName: "Difficult Conversations",
    authors: ["Douglas Stone", "Bruce Patton", "Sheila Heen"],
    year: 1999,
    seminalWork: "Difficult Conversations: How to Discuss What Matters Most (1999)",
    category: "psychology",
    corePrinciples: [
      "Every difficult conversation is actually THREE conversations happening simultaneously",
      "'What Happened?' Conversation — the disagreement about facts, intentions, and blame. Move from certainty to curiosity: 'How do we each see this differently?'",
      "'Feelings Conversation' — emotions that are present but unaddressed. Unexpressed feelings leak into the conversation as blame, withdrawal, or aggression",
      "'Identity Conversation' — internal: 'What does this say about me?' Am I competent? Am I a good person? Am I worthy of love? Identity threats cause the strongest reactions",
      "Move from a 'message delivery' stance to a 'learning conversation' stance — your goal is to understand, not to be right",
    ],
    keyTechniques: [
      {
        name: "Three Conversation Mapping",
        description: "For each party, map what's happening across all three layers: What Happened (their version of events), Feelings (emotions they're carrying), Identity (what's at stake for their self-image)",
        whenToUse: "At the start of Discovery — to understand the full picture beyond surface claims",
      },
      {
        name: "Contribution System vs. Blame",
        description: "Shift from 'whose fault is it?' to 'how did we each contribute to this situation?' Both parties usually contributed something.",
        whenToUse: "When parties are stuck in blame cycles",
      },
      {
        name: "Identity Anchoring",
        description: "Help parties adopt the 'And Stance': 'I made a mistake AND I'm still a good person.' This prevents all-or-nothing thinking about self.",
        whenToUse: "When a party seems disproportionately defensive — they're protecting identity, not just position",
      },
      {
        name: "The Third Story",
        description: "Describe the situation from the perspective of a neutral observer who can see both sides. Start conversations from this 'third story' rather than from either party's version.",
        whenToUse: "As the opening frame in Exploration phase",
      },
    ],
    diagnosticQuestions: [
      "Is this conflict about what happened, about unexpressed feelings, or about an identity threat?",
      "Are emotions being expressed directly, or are they leaking out as blame and withdrawal?",
      "What is at stake for each party's self-image? What are they afraid this situation says about them?",
      "Can each party see their own contribution to the problem, or are they only assigning blame?",
    ],
    bestFor: [
      "Workplace disagreements",
      "relationship conflicts",
      "any dispute where parties seem disproportionately reactive",
      "situations with blame cycles",
      "conflicts where 'the facts' are disputed",
    ],
    limitations: [
      "Requires emotional awareness from both parties",
      "Less applicable to pure resource-allocation disputes",
      "Identity work can feel uncomfortable or invasive",
    ],
    glaslStages: "1-5",
    tacitusPrimitives: ["Narrative", "Interest", "Event", "Claim"],
  },

  // ── 27. Lewicki Trust Repair ──────────────────────────────────────────────
  {
    id: "lewicki-trust-repair",
    name: "Trust Repair and Rebuilding",
    shortName: "Lewicki Trust Repair",
    authors: ["Roy Lewicki", "Edward Tomlinson"],
    year: 2006,
    seminalWork: "Models of Interpersonal Trust Development (2006)",
    category: "psychology",
    corePrinciples: [
      "Trust breaks differently depending on which trust dimension was violated: competence (ability), benevolence (goodwill), or integrity (values/principles)",
      "Integrity-based trust is the hardest to repair — once someone believes you violated a core principle, apologies alone won't work",
      "Trust repair requires matching the repair strategy to the violation type: competence violations need demonstration of capability, integrity violations need structural safeguards",
      "Verbal repair (apology, explanation) must be followed by behavioral repair (consistent trustworthy behavior over time)",
      "Trust is repaired incrementally through small acts, not through grand gestures",
    ],
    keyTechniques: [
      {
        name: "Violation Diagnosis",
        description: "Identify which trust dimension was violated: Was it competence ('they messed up'), benevolence ('they don't care about me'), or integrity ('they lied/cheated')?",
        whenToUse: "Whenever trust is a central issue in the conflict",
      },
      {
        name: "Matched Repair Strategy",
        description: "Competence violation → demonstrate improved capability. Benevolence violation → show genuine care through actions. Integrity violation → accept accountability + create structural safeguards (not just promises).",
        whenToUse: "When designing agreement terms that address trust breakdown",
      },
      {
        name: "Trust Calibration Exercise",
        description: "Have each party rate their current trust in the other on 3 dimensions (ability 0-100, benevolence 0-100, integrity 0-100). This makes the invisible visible.",
        whenToUse: "Before Negotiation phase — surfaces exactly what needs to be rebuilt",
      },
    ],
    diagnosticQuestions: [
      "Which dimension of trust was violated — competence, benevolence, or integrity?",
      "Has the violating party acknowledged the specific violation, or just apologized generically?",
      "What behavioral evidence (not just words) would begin to rebuild trust?",
      "Are there structural safeguards that could reduce the need for personal trust?",
    ],
    bestFor: [
      "Post-betrayal conflicts",
      "workplace trust breakdowns",
      "business partner disputes",
      "any conflict where 'I don't trust them' is the core barrier",
    ],
    limitations: [
      "Trust repair is slow — parties must accept incremental progress",
      "Some integrity violations may be irreparable",
      "Requires the violating party to accept accountability",
    ],
    glaslStages: "2-6",
    tacitusPrimitives: ["Commitment", "Event", "Narrative", "Leverage"],
  },

  // ── 28. Shapiro Identity ──────────────────────────────────────────────────
  {
    id: "shapiro-identity",
    name: "Negotiating the Nonnegotiable",
    shortName: "Shapiro Identity",
    authors: ["Daniel L. Shapiro"],
    year: 2016,
    seminalWork: "Negotiating the Nonnegotiable: How to Resolve Your Most Emotionally Charged Conflicts (2016)",
    category: "psychology",
    corePrinciples: [
      "The most intractable conflicts aren't about resources — they're about IDENTITY. When people feel their identity is threatened, they become irrational, tribal, and absolutist",
      "Five 'lures' pull people into identity-based conflict: vertigo (all-consuming emotional whirlpool), repetition compulsion (replaying old wounds), taboos (undiscussable topics), assault on the sacred (violation of core values), identity politics (us vs. them)",
      "The 'Tribes Effect' — in conflict, we regress into tribal thinking: my group is good, their group is bad, and compromise equals betrayal",
      "To negotiate the nonnegotiable: first address the identity threat, then the substance. Identity always comes first.",
      "Integration, not compromise — find a resolution that honors both parties' core identities rather than asking either to abandon who they are",
    ],
    keyTechniques: [
      {
        name: "Identity Mapping",
        description: "For each party, identify what aspects of their identity feel threatened: role, values, beliefs, group membership, self-image, sacred values.",
        whenToUse: "When parties seem irrationally attached to a position — they're protecting identity, not interest",
      },
      {
        name: "Vertigo Detection",
        description: "Notice when a party has been 'consumed' by the conflict — they can't think about anything else, they see everything through the lens of this dispute. This is emotional vertigo.",
        whenToUse: "When a party seems obsessive about the conflict or unable to consider alternatives",
      },
      {
        name: "Taboo Surfacing",
        description: "Identify the undiscussable — the topic everyone avoids because it's too threatening. Gently name it: 'I wonder if there's something here we haven't been able to say yet.'",
        whenToUse: "When the conversation keeps circling the same points without progress — there's usually a taboo underneath",
      },
      {
        name: "Relational Identity Integration",
        description: "Help parties build a SHARED identity: 'We are two people trying to solve this together' rather than 'I am fighting against you.' Create a superordinate identity.",
        whenToUse: "In Negotiation/Resolution — after identity threats have been addressed",
      },
    ],
    diagnosticQuestions: [
      "What aspect of their identity does each party feel this conflict threatens?",
      "Are there taboos — topics that feel too dangerous to raise but that everyone knows are present?",
      "Is either party caught in 'vertigo' — so consumed by the conflict that they can't see clearly?",
      "Can the parties find a shared identity that transcends the conflict?",
    ],
    bestFor: [
      "Identity-based disputes",
      "values conflicts",
      "religious/cultural clashes",
      "organizational conflicts about mission/values",
      "any 'nonnegotiable' position",
      "family conflicts involving role identity",
    ],
    limitations: [
      "Requires psychological sophistication from the mediator",
      "Identity work can be uncomfortable",
      "Not all parties are ready for this depth",
      "Some identity positions may genuinely be incompatible",
    ],
    glaslStages: "3-7",
    tacitusPrimitives: ["Narrative", "Interest", "Constraint", "Event"],
  },

  // ── 29. Solution-Focused Brief Approach ──────────────────────────────────
  {
    id: "solution-focused",
    name: "Solution-Focused Brief Approach",
    shortName: "Solution-Focused",
    authors: ["Steve de Shazer", "Insoo Kim Berg"],
    year: 1985,
    seminalWork: "Keys to Solution in Brief Therapy (1985)",
    category: "mediation",
    corePrinciples: [
      "Focus on solutions, not problems — 'What would you like instead?' not 'What's wrong?'",
      "Exceptions contain the solution — times when the problem DIDN'T happen reveal what already works",
      "Small steps first — one small change often creates cascading positive effects",
      "The person is the expert on their own life — the mediator is expert on asking useful questions",
      "If it works, do more of it. If it doesn't work, do something different. Simple as that.",
    ],
    keyTechniques: [
      {
        name: "Miracle Question",
        description: "'Suppose tonight while you're asleep, a miracle happens and this conflict is completely resolved. When you wake up, what's the first thing you'd notice that tells you things are different?' This bypasses resistance and accesses the desired future.",
        whenToUse: "When parties are stuck in problem-talk and can't envision resolution — especially good in Negotiation phase",
      },
      {
        name: "Exception Finding",
        description: "'Has there been a time recently when this problem was LESS intense, or when things went better between you? What was different then?' Exceptions reveal existing solutions.",
        whenToUse: "In Discovery — to find resources and strengths, not just problems",
      },
      {
        name: "Scaling Questions",
        description: "'On a scale of 1-10, where 10 is fully resolved and 1 is the worst it's ever been, where are you now? What would one point higher look like?'",
        whenToUse: "To measure progress, identify next steps, and make abstract concepts concrete",
      },
      {
        name: "Coping Questions",
        description: "'Given how difficult this has been, how have you managed to cope? What's kept you going?' This builds agency and self-efficacy even in distress.",
        whenToUse: "When parties feel helpless or hopeless",
      },
      {
        name: "Pre-Session Change",
        description: "'Since you decided to come to this mediation, has anything already started to shift?' Often the decision to mediate itself begins the change.",
        whenToUse: "At the very start of the session — captures momentum",
      },
    ],
    diagnosticQuestions: [
      "Are we spending too much time analyzing the problem and not enough time building the solution?",
      "What exceptions to the problem already exist? What's already working?",
      "Can each party describe what they WANT (positive) rather than what they DON'T want (negative)?",
      "What's the smallest step that would represent real progress?",
    ],
    bestFor: [
      "Any conflict where parties are overwhelmed by problem-talk",
      "conflicts that feel intractable but actually have moments of peace",
      "short mediation sessions",
      "individuals/couples",
      "workplace disputes where quick progress is needed",
    ],
    limitations: [
      "May bypass necessary emotional processing",
      "Can feel dismissive if used before parties feel heard",
      "Not suited for deeply structural or systemic conflicts",
      "Parties must have SOME capacity for future-thinking",
    ],
    glaslStages: "1-4",
    tacitusPrimitives: ["Interest", "Commitment", "Event"],
  },

  // ── 30. Mnookin Beyond Winning ────────────────────────────────────────────
  {
    id: "mnookin-beyond-winning",
    name: "Beyond Winning: The Tension Management Framework",
    shortName: "Mnookin Tensions",
    authors: ["Robert Mnookin", "Scott Peppet", "Andrew Tulumello"],
    year: 2000,
    seminalWork: "Beyond Winning: Negotiating to Create Value in Deals and Disputes (2000)",
    category: "negotiation",
    corePrinciples: [
      "Every negotiation involves managing THREE tensions simultaneously — not resolving them, but managing them dynamically",
      "Tension 1: Creating value vs. Distributing value — you need to expand the pie AND divide it fairly",
      "Tension 2: Empathy vs. Assertiveness — understand their perspective AND advocate for your own",
      "Tension 3: Agent vs. Principal — the negotiator's interests may diverge from the party's interests",
      "The goal is not to eliminate these tensions but to be AWARE of them and manage them skillfully",
    ],
    keyTechniques: [
      {
        name: "Value Creation First",
        description: "Before distributing, brainstorm options that create value for both. Trade on differences (different priorities, risk tolerance, time horizons).",
        whenToUse: "In Negotiation phase before parties start dividing",
      },
      {
        name: "Empathy-Assertiveness Balance",
        description: "Model for parties how to hold both: 'I understand your concern about X, AND my need for Y is genuine too.' The word 'and' replaces 'but'.",
        whenToUse: "When parties see understanding the other as weakness",
      },
      {
        name: "Behind-the-Table Analysis",
        description: "Understand the pressures BEHIND each party — who are they accountable to? What constraints do they face from their own side?",
        whenToUse: "When a party seems unable to be flexible — they may face internal pressure",
      },
    ],
    diagnosticQuestions: [
      "Are we stuck in value-distribution (zero-sum) when value-creation is possible?",
      "Is either party sacrificing empathy for assertiveness, or vice versa?",
      "What pressures does each party face from their own 'behind-the-table' constituents?",
    ],
    bestFor: [
      "Complex negotiations",
      "business disputes",
      "multi-party situations",
      "disputes involving agents/lawyers/representatives",
    ],
    limitations: [
      "More analytical than emotional — pair with NVC or SFBT for emotionally charged disputes",
      "Assumes some negotiation sophistication",
    ],
    glaslStages: "1-5",
    tacitusPrimitives: ["Interest", "Constraint", "Leverage", "Claim"],
  },

  // ── 31. Follett Creative Integration ─────────────────────────────────────
  {
    id: "follett-integration",
    name: "Creative Integration",
    shortName: "Follett Integration",
    authors: ["Mary Parker Follett"],
    year: 1924,
    seminalWork: "Creative Experience (1924)",
    category: "transformation",
    corePrinciples: [
      "Three responses to conflict: domination (one side wins), compromise (both lose something), integration (a creative third option that satisfies both fully)",
      "Integration is always worth seeking — it's harder to find but produces the most durable outcomes",
      "'Bring the differences out into the open' — don't suppress disagreement, USE it as the raw material for creative solutions",
      "Power should be 'power-with' (joint), not 'power-over' (coercive) — genuine authority comes from the situation, not from the person",
      "The law of the situation — let the facts and the situation determine the right action, not either party's will",
    ],
    keyTechniques: [
      {
        name: "Integration Search",
        description: "After hearing both positions, ask: 'Is there a third option that fully satisfies both of your core needs — not a compromise where you each give up something, but a creative solution where you each get what matters most?'",
        whenToUse: "In Negotiation — after interests are clear but before compromise is offered",
      },
      {
        name: "Difference as Resource",
        description: "Instead of minimizing differences, highlight them: 'Your different perspectives are actually a resource here — they might point us toward a solution neither of you would have found alone.'",
        whenToUse: "When parties are frustrated by their differences",
      },
      {
        name: "Power-With Reframe",
        description: "Shift from 'who has more power' to 'how do we pool our different forms of influence to solve this together?'",
        whenToUse: "When power dynamics are creating adversarial framing",
      },
    ],
    diagnosticQuestions: [
      "Have we genuinely searched for an integrative solution, or jumped to compromise too quickly?",
      "Are we treating the parties' differences as obstacles or as resources?",
      "Is power being exercised 'over' the other party, or 'with' them?",
    ],
    bestFor: [
      "Any conflict where compromise feels inadequate",
      "creative problem-solving disputes",
      "team/organizational conflicts",
      "disputes where novel solutions are possible",
    ],
    limitations: [
      "Integration isn't always possible — some interests are genuinely incompatible",
      "Requires creative thinking capacity from parties",
      "Time-intensive",
    ],
    glaslStages: "1-4",
    tacitusPrimitives: ["Interest", "Claim", "Constraint", "Commitment"],
  },
  {
    id: "circle-process",
    name: "Circle Process (Pranis)",
    shortName: "Circle Process",
    authors: ["Kay Pranis"],
    year: 2005,
    seminalWork: "The Little Book of Circle Processes (2005)",
    category: "mediation",
    corePrinciples: [
      "A talking piece ensures equal voice — whoever holds it speaks, everyone else listens",
      "Shared values are named before the dispute is addressed",
      "Collective wisdom exceeds any individual's knowledge",
      "Storytelling is both a healing and a truth-telling mechanism",
      "Community accountability supplements individual agreement",
    ],
    keyTechniques: [
      { name: "Talking piece rounds", description: "Pass a physical or metaphorical object; only the holder speaks", whenToUse: "Opening, Discovery — ensures each party is fully heard" },
      { name: "Values consensus", description: "Begin by naming shared values before addressing the dispute", whenToUse: "Opening — builds shared ethical ground" },
      { name: "Check-in / check-out questions", description: "Structured open questions to enter and close the circle", whenToUse: "Opening and closing of each session" },
      { name: "Story sharing", description: "Each party narrates their experience without interruption", whenToUse: "Discovery — surfaces narrative and emotion together" },
    ],
    diagnosticQuestions: [
      "What brought you into this circle today?",
      "What value is most important to you in how we treat each other?",
      "What has this conflict cost you — beyond the surface issue?",
      "What would healing look like for you?",
    ],
    bestFor: ["Community disputes", "Workplace team conflicts", "Restorative justice", "Multi-party disputes"],
    limitations: ["Requires time and space for rounds", "Not suited to urgent decisions", "Difficult with extreme power imbalances"],
    glaslStages: "1-4",
    tacitusPrimitives: ["Actor", "Narrative", "Interest", "Commitment"],
  },
  {
    id: "appreciative-inquiry",
    name: "Appreciative Inquiry (4-D Model)",
    shortName: "Appreciative Inquiry",
    authors: ["David Cooperrider", "Suresh Srivastva"],
    year: 1987,
    seminalWork: "Appreciative Inquiry in Organizational Life (1987)",
    category: "transformation",
    corePrinciples: [
      "Focus on what is working — asset framing amplifies possibilities",
      "Positive questions generate positive data and positive change",
      "Images of an ideal future guide present action",
      "The act of inquiry itself is an intervention — questions are never neutral",
      "Words and stories literally create the worlds parties inhabit",
    ],
    keyTechniques: [
      { name: "Discover", description: "Identify peak experiences and what has worked well between parties", whenToUse: "Discovery — before surfacing grievances" },
      { name: "Dream", description: "Envision the best possible future state of the relationship", whenToUse: "Exploration — after surface issues are understood" },
      { name: "Design", description: "Co-create concrete pathways toward the envisioned future", whenToUse: "Negotiation — builds toward agreement" },
      { name: "Destiny", description: "Commit to actions that sustain the positive future", whenToUse: "Resolution — closing and implementation" },
    ],
    diagnosticQuestions: [
      "Tell me about a time when you and the other party were at your best together.",
      "What conditions made that possible?",
      "What would your ideal outcome look like — not just the absence of the problem?",
      "What strengths in this relationship are worth preserving?",
    ],
    bestFor: ["Organizational conflicts", "Team dynamics", "Long-term relationship repair", "Change management disputes"],
    limitations: ["Can feel forced when emotions are raw", "Doesn't directly address harm or accountability", "Not suited to pure rights-based disputes"],
    glaslStages: "1-5",
    tacitusPrimitives: ["Interest", "Commitment", "Narrative"],
  },
  {
    id: "collaborative-law",
    name: "Collaborative Law / Practice",
    shortName: "Collaborative Practice",
    authors: ["Stuart Webb"],
    year: 1990,
    seminalWork: "Collaborative Law: Achieving Effective Resolution in Divorce (1990)",
    category: "negotiation",
    corePrinciples: [
      "Parties commit in writing to resolve without litigation — the commitment changes the dynamic",
      "Voluntary, full disclosure of all relevant information is required",
      "Neutral experts are shared, not adversarial",
      "Interest-based solutions are sought jointly",
      "If the process fails, all professionals withdraw — creating powerful incentive to succeed",
    ],
    keyTechniques: [
      { name: "Four-way meetings", description: "Both parties and both advisors present simultaneously", whenToUse: "All phases — the core forum" },
      { name: "Participation agreement", description: "Written commitment to process and non-litigation", whenToUse: "Opening — creates accountability" },
      { name: "Neutral expert panels", description: "Shared specialists replace dueling experts", whenToUse: "Discovery and Exploration — when technical facts are disputed" },
      { name: "Interest mapping", description: "Systematic elicitation of underlying needs from both parties", whenToUse: "Discovery" },
    ],
    diagnosticQuestions: [
      "What information would each of you need to feel confident in any agreement?",
      "What would make this process feel fair to you — not just the outcome?",
      "Are there issues where you'd benefit from a neutral expert's view?",
      "What would it mean to your relationship to resolve this without courts?",
    ],
    bestFor: ["Divorce and family disputes", "Business partnership dissolution", "Estate disputes", "Employment separations"],
    limitations: ["Requires all parties to opt in", "Expensive if breakdown occurs", "Not suitable for abuse or coercion situations"],
    glaslStages: "2-6",
    tacitusPrimitives: ["Claim", "Interest", "Constraint", "Commitment"],
  },
  {
    id: "dialogic-od",
    name: "Dialogic Organization Development",
    shortName: "Dialogic OD",
    authors: ["Gervase Bushe", "Robert Marshak"],
    year: 2015,
    seminalWork: "Dialogic Organization Development (2015)",
    category: "transformation",
    corePrinciples: [
      "Reality is socially constructed — changing the conversation changes the reality",
      "Change occurs through narrative disruption, not structural fixes",
      "Multiple perspectives are all simultaneously valid",
      "Generative conversations create new possibilities that didn't exist before",
      "Emergence is more powerful than planning — create conditions, don't script outcomes",
    ],
    keyTechniques: [
      { name: "Narrative inquiry", description: "Explore the dominant story each party holds about the conflict", whenToUse: "Discovery — before any problem-solving" },
      { name: "Polyphonic dialogue", description: "Create space for multiple voices without resolving them prematurely", whenToUse: "Exploration — when deadlock reflects narrative entrenchment" },
      { name: "Alternative story generation", description: "Introduce plausible counter-narratives to disrupt fixed interpretations", whenToUse: "Exploration and Negotiation" },
      { name: "Generative questioning", description: "Questions designed to expand possibility, not diagnose problems", whenToUse: "All phases" },
    ],
    diagnosticQuestions: [
      "What story are you telling yourself about why this is happening?",
      "What might be another way to understand this situation?",
      "What would have to be true for the other party's perspective to make sense?",
      "How would you want the next chapter of this situation to begin?",
    ],
    bestFor: ["Organizational culture conflicts", "Leadership disputes", "Change resistance", "Departmental silos"],
    limitations: ["Abstract for parties seeking concrete solutions", "Slow — not suited to urgent disputes", "Requires skilled facilitation"],
    glaslStages: "1-4",
    tacitusPrimitives: ["Narrative", "Actor", "Interest"],
  },
  {
    id: "riskin-grid",
    name: "Riskin Grid (Mediator Orientations)",
    shortName: "Riskin Grid",
    authors: ["Leonard Riskin"],
    year: 1996,
    seminalWork: "Understanding Mediators' Orientations, Strategies, and Techniques (1996)",
    category: "mediation",
    corePrinciples: [
      "Mediator orientation varies on two axes: facilitative–evaluative and narrow–broad",
      "Facilitative mediators empower parties; evaluative mediators use expertise to assess outcomes",
      "Narrow problem definition focuses on legal rights; broad scope addresses full relationship",
      "No orientation is universally correct — context determines the appropriate blend",
      "Transparency about orientation builds trust with parties",
    ],
    keyTechniques: [
      { name: "Scope assessment", description: "Define whether to address just the immediate dispute or the broader relationship", whenToUse: "Opening — before engaging substance" },
      { name: "Evaluative intervention", description: "Mediator offers assessment of likely outcomes or fairness", whenToUse: "Negotiation — when parties are unrealistic about alternatives" },
      { name: "Interest expansion", description: "Broaden scope to surface relational and systemic dimensions", whenToUse: "Discovery — when narrow framing blocks progress" },
      { name: "Reality testing", description: "Challenge unrealistic positions by reference to objective standards", whenToUse: "Negotiation" },
    ],
    diagnosticQuestions: [
      "Are we trying to resolve this specific incident, or the broader relationship pattern?",
      "What would a neutral third party say is a fair outcome here?",
      "If this went to adjudication, what do you think the likely result would be?",
      "Is there a relationship dimension here we haven't fully addressed?",
    ],
    bestFor: ["Legal disputes", "Commercial mediations", "Cases with power imbalances", "Multi-issue conflicts"],
    limitations: ["Evaluative approach risks mediator bias", "Narrow framing may miss root causes", "Requires domain expertise for evaluative moves"],
    glaslStages: "2-7",
    tacitusPrimitives: ["Claim", "Constraint", "Leverage", "Interest"],
  },
  {
    id: "interest-based-relational",
    name: "Interest-Based Relational Approach",
    shortName: "IBR Approach",
    authors: ["Roger Fisher", "Scott Brown"],
    year: 1988,
    seminalWork: "Getting Together: Building Relationships as We Negotiate (1988)",
    category: "negotiation",
    corePrinciples: [
      "The relationship is itself a primary interest, not just the context for negotiation",
      "Be unconditionally constructive — behave well regardless of the other party's behavior",
      "Separate relationship repair from substantive problem-solving — attend to both",
      "Long-term partnership value often exceeds short-term negotiation gains",
      "Both rational and emotional dimensions require attention",
    ],
    keyTechniques: [
      { name: "Relationship BATNA", description: "Assess the cost to the relationship if no agreement is reached", whenToUse: "Opening and Negotiation" },
      { name: "Unconditional constructiveness", description: "Commit to constructive behavior regardless of provocation", whenToUse: "All phases — especially escalation moments" },
      { name: "Shared vision creation", description: "Build a joint picture of what the relationship could be", whenToUse: "Exploration — after interests are surfaced" },
      { name: "Relationship maintenance planning", description: "Agree on ongoing mechanisms post-agreement", whenToUse: "Resolution" },
    ],
    diagnosticQuestions: [
      "Regardless of how this dispute resolves, what kind of relationship do you want going forward?",
      "What would it cost you beyond this issue if this relationship ended badly?",
      "What's one thing you appreciate about the other party that's easy to forget right now?",
      "What does a healthy version of this relationship look like?",
    ],
    bestFor: ["Ongoing business relationships", "Neighbor disputes", "Long-term partnerships", "Family business conflicts"],
    limitations: ["Requires both parties to value the relationship", "Not suited to one-off transactional disputes", "Can suppress legitimate grievances"],
    glaslStages: "1-5",
    tacitusPrimitives: ["Interest", "Commitment", "Actor", "Narrative"],
  },
  {
    id: "cross-cultural-mediation",
    name: "Cross-Cultural Conflict Resolution",
    shortName: "Cross-Cultural Mediation",
    authors: ["Kevin Avruch"],
    year: 1998,
    seminalWork: "Culture and Conflict Resolution (1998)",
    category: "mediation",
    corePrinciples: [
      "Culture profoundly shapes how conflict is perceived, expressed, and resolved",
      "Face-saving is a near-universal concern that must be built into the process",
      "High-context cultures communicate indirectly; low-context cultures communicate explicitly",
      "Individualist and collectivist value systems produce different negotiation priorities",
      "Cultural humility — curiosity without stereotyping — is more useful than assumed expertise",
    ],
    keyTechniques: [
      { name: "Cultural inquiry", description: "Explore cultural frameworks without stereotyping — ask, don't assume", whenToUse: "Opening — before structuring the process" },
      { name: "Face-saving protocols", description: "Design process to allow concessions without public loss of status", whenToUse: "Negotiation and Resolution" },
      { name: "Indirect communication pathway", description: "Use shuttle diplomacy when direct confrontation is culturally uncomfortable", whenToUse: "When direct dialogue creates face-threat" },
      { name: "Collective framing", description: "Reframe individual demands as serving collective interests", whenToUse: "Exploration and Negotiation with collectivist-oriented parties" },
    ],
    diagnosticQuestions: [
      "How would you ideally like this resolved — in terms of process, not just outcome?",
      "Is there anything about how we're conducting this conversation that doesn't feel right to you?",
      "What would it mean within your community if this resolved well?",
      "Are there any topics or approaches you'd prefer we handle differently?",
    ],
    bestFor: ["International commercial disputes", "Immigration and asylum conflicts", "Multi-ethnic workplace disputes", "Diplomatic mediations"],
    limitations: ["Risk of stereotyping if cultural assumptions aren't checked", "Requires cultural broker, not just linguistic translator", "Process itself may be culturally inappropriate"],
    glaslStages: "1-6",
    tacitusPrimitives: ["Actor", "Narrative", "Constraint", "Interest"],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// RETRIEVAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

const PHASE_FRAMEWORK_AFFINITY: Record<string, string[]> = {
  Opening: ["active-listening", "de-escalation", "reframing", "moore", "curle"],
  Discovery: ["fisher-ury", "active-listening", "reframing", "mayer", "thomas-kilmann", "argyris"],
  Exploration: ["fisher-ury", "batna-protocol", "pruitt-kim", "deutsch", "galtung", "ury-brett-goldberg"],
  Negotiation: ["fisher-ury", "ury-past-no", "batna-protocol", "schelling", "pruitt-kim", "ury-brett-goldberg"],
  Resolution: ["fisher-ury", "bush-folger", "winslade-monk", "lederach", "coleman"],
  Agreement: ["batna-protocol", "deutsch", "lederach", "curle"],
};

function parseGlaslRange(range: string | number[]): { min: number; max: number } {
  if (Array.isArray(range)) {
    if (range.length === 0) return { min: 1, max: 9 };
    return { min: Math.min(...range), max: Math.max(...range) };
  }
  if (range === "all") return { min: 1, max: 9 };
  const parts = range.split("-").map(Number);
  if (parts.length === 1) return { min: parts[0], max: parts[0] };
  return { min: parts[0], max: parts[1] };
}

export function getRelevantFrameworks(context: {
  escalationLevel?: number;
  phase?: string;
  missingPrimitives?: string[];
  conflictType?: string;
}): FrameworkEntry[] {
  const { escalationLevel, phase, missingPrimitives } = context;

  const scored = FRAMEWORKS.map((fw) => {
    let score = 0;

    // Glasl stage match
    if (escalationLevel !== undefined) {
      const { min, max } = parseGlaslRange(fw.glaslStages);
      if (escalationLevel >= min && escalationLevel <= max) {
        score += 30;
      } else {
        const distance = Math.min(
          Math.abs(escalationLevel - min),
          Math.abs(escalationLevel - max),
        );
        score -= distance * 5;
      }
    }

    // Phase affinity
    if (phase && PHASE_FRAMEWORK_AFFINITY[phase]) {
      if (PHASE_FRAMEWORK_AFFINITY[phase].includes(fw.id)) {
        score += 25;
      }
    }

    // Missing primitive alignment
    if (missingPrimitives && missingPrimitives.length > 0) {
      const overlap = missingPrimitives.filter((p) =>
        fw.tacitusPrimitives.includes(p),
      ).length;
      score += overlap * 10;
    }

    return { fw, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.fw);
}

export function getDiagnosticQuestions(
  frameworkIds: string[],
  existingPrimitiveTypes: string[],
): string[] {
  const allPrimTypes = [
    "Actor", "Claim", "Interest", "Constraint",
    "Leverage", "Commitment", "Event", "Narrative",
  ];
  const missingTypes = allPrimTypes.filter(
    (t) => !existingPrimitiveTypes.includes(t),
  );

  const questions: string[] = [];
  const seen = new Set<string>();

  // Prioritize frameworks that address missing primitives
  const orderedFws = [
    ...FRAMEWORKS.filter(
      (fw) =>
        frameworkIds.includes(fw.id) &&
        fw.tacitusPrimitives.some((p) => missingTypes.includes(p)),
    ),
    ...FRAMEWORKS.filter(
      (fw) =>
        frameworkIds.includes(fw.id) &&
        !fw.tacitusPrimitives.some((p) => missingTypes.includes(p)),
    ),
  ];

  for (const fw of orderedFws) {
    for (const q of fw.diagnosticQuestions) {
      if (!seen.has(q)) {
        seen.add(q);
        questions.push(`[${fw.shortName}] ${q}`);
      }
    }
  }

  return questions;
}

export function getFrameworkById(id: string): FrameworkEntry | undefined {
  return FRAMEWORKS.find((fw) => fw.id === id);
}

export function getFrameworksByCategory(
  category: FrameworkEntry["category"],
): FrameworkEntry[] {
  return FRAMEWORKS.filter((fw) => fw.category === category);
}

export function buildFrameworkSnippet(frameworks: FrameworkEntry[]): string {
  return frameworks
    .map(
      (f) =>
        `[${f.shortName}] ${f.corePrinciples.slice(0, 3).join("; ")}. Techniques: ${f.keyTechniques.map((t) => t.name).join(", ")}`,
    )
    .join("\n");
}
