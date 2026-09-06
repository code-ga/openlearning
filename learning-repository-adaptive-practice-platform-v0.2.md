# Learning Repository & Adaptive Practice Platform

## Brainstorm → Architecture → Data Model → Flows → MVP → Phases

> **Document status:** Draft / discussion RFC\
> **Version:** 0.2\
> **Date:** 2026-09-05\
> **Primary stack:** Bun.js + TypeScript + PostgreSQL\
> **Goal:** Build a reusable, contribution-friendly learning repository
> and adaptive practice system from a large corpus of PDFs/exams, while
> keeping AI usage and infrastructure cost low.

------------------------------------------------------------------------

## 0. Executive Summary

The project is a **GitHub-like learning repository + adaptive learning
engine**.

The central idea is:

> **PDF is source data. Structured knowledge, problems, skills,
> evidence, relationships, and learner state are the actual product.**

The system should support:

-   importing large numbers of exam PDFs;
-   extracting and normalizing questions;
-   organizing questions and knowledge into reusable repositories;
-   connecting concepts, skills, prerequisites, examples, proofs,
    procedures, and problems;
-   supporting multiple solution approaches for the same problem;
-   generating Polya-style hints;
-   evaluating students by **skill mastery**, not merely
    question-by-question correctness;
-   generating adaptive practice sessions;
-   generating exams with historical weighting and controlled difficulty
    expansion;
-   preventing scope drift;
-   allowing human contributors to correct AI-generated metadata;
-   reusing the same knowledge graph for learning, revision, search, and
    exam generation;
-   minimizing AI calls through deterministic-first pipelines and cached
    enrichment.

The architecture deliberately separates:

1.  **Canonical data** --- facts the system treats as structured
    content.
2.  **Derived data** --- embeddings, classifications, difficulty
    estimates, recommendations.
3.  **Evidence/provenance** --- where every piece of content came from.
4.  **Learner state** --- what a particular student knows.
5.  **Policies** --- how the system decides what to show next.

------------------------------------------------------------------------

# 1. Problem Statement

## 1.1 The naive model

A traditional learning app might model:

``` text
Subject
  └── Chapter
       └── Lesson
            └── Question
```

This looks simple but becomes restrictive quickly.

For example:

-   A calculus problem may test inequalities + derivatives +
    optimization.
-   A chemistry experiment may support several conclusions.
-   A history claim may depend on multiple sources.
-   One problem may have substitution, Cauchy, and Lagrange-multiplier
    solutions.
-   A skill may appear in several subjects or exam formats.
-   The same concept can be explained by many resources.
-   A question from an old exam can be useful as practice even when it
    is not part of the user's exact syllabus.

Therefore, the system should not make the folder hierarchy the source of
truth.

------------------------------------------------------------------------

# 2. Core Product Vision

## 2.1 Learning Repository

Think:

> GitHub for learning knowledge.

A repository can contain:

-   concepts;
-   definitions;
-   theorems/statements;
-   examples;
-   problems;
-   solutions;
-   experiments;
-   sources;
-   relationships;
-   learning paths;
-   scope/curriculum metadata.

Contributors can:

-   create repositories;
-   upload source documents;
-   submit changes;
-   open issues;
-   propose corrections;
-   improve classifications;
-   add solution approaches;
-   review AI suggestions.

## 2.2 Adaptive Learning Engine

The repository becomes the source for:

-   practice;
-   review;
-   exam simulation;
-   rush review;
-   micro-practice;
-   recommendation;
-   explanation;
-   remediation.

The learner does not interact with raw PDFs.

The pipeline is:

``` text
PDF
 ↓
Source extraction
 ↓
Canonical structured content
 ↓
Knowledge / Problem / Skill Graph
 ↓
Learning policies
 ↓
Student-specific experience
```

------------------------------------------------------------------------

# 3. Design Principles

## 3.1 Deterministic first

AI should be an **accelerator**, not the engine.

Use deterministic algorithms whenever possible:

-   PDF extraction;
-   OCR;
-   question segmentation;
-   answer extraction;
-   metadata extraction;
-   lexical search;
-   PostgreSQL full-text search;
-   BM25;
-   graph traversal;
-   scope filtering;
-   spaced repetition;
-   mastery updates;
-   difficulty calibration;
-   exam generation;
-   session construction.

Use AI selectively for:

-   ambiguous semantic classification;
-   difficult skill mapping;
-   prerequisite inference;
-   solution decomposition;
-   hint generation;
-   complex explanations;
-   novel content generation.

------------------------------------------------------------------------

## 3.2 AI output is not automatically truth

Every AI-generated value should be treated as an annotation:

``` text
AI suggestion
    ↓
confidence
    ↓
review / validation
    ↓
canonical data
```

AI should never silently overwrite canonical data.

------------------------------------------------------------------------

## 3.3 Stable IDs, replaceable projections

The canonical identity of a knowledge object must not depend on:

-   embeddings;
-   model versions;
-   chunk IDs;
-   search indexes.

Example:

``` text
knowledge_id = skill:calculus.optimization
```

An embedding is only a derived projection:

``` text
knowledge_id
embedding_model
embedding_version
vector
```

Changing embedding models should not require changing the knowledge
graph.

------------------------------------------------------------------------

## 3.4 Provenance everywhere

Every important piece of content should answer:

> Where did this come from?

Example:

``` text
Problem P123
  ├── source: Exam 2024
  ├── source_document: exam-2024.pdf
  ├── page: 17
  ├── extracted_from: block-91
  └── normalized_by: pipeline-v3
```

------------------------------------------------------------------------

## 3.5 Scope is a first-class concept

The system must not confuse:

> "This question is useful"

with:

> "This question belongs to the student's current learning scope."

A student preparing for a specific exam should not suddenly receive
unrelated university-level material.

------------------------------------------------------------------------

## 3.6 Simplicity over premature abstraction

The system should be:

-   graph-oriented conceptually;
-   relational physically at first.

PostgreSQL is sufficient for the MVP.

Do **not** introduce a graph database unless actual query patterns prove
PostgreSQL insufficient.

------------------------------------------------------------------------

# 4. High-Level Architecture

``` text
                         ┌────────────────────┐
                         │      Clients       │
                         │ Web / Mobile / CLI │
                         └─────────┬──────────┘
                                   │
                                   ▼
                         ┌────────────────────┐
                         │   Bun.js API       │
                         │ TypeScript         │
                         └─────────┬──────────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            ▼                      ▼                      ▼
   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
   │ Learning       │    │ Repository     │    │ Search         │
   │ Engine         │    │ Engine         │    │ Engine         │
   └───────┬────────┘    └───────┬────────┘    └───────┬────────┘
           │                      │                      │
           └──────────────────────┼──────────────────────┘
                                  ▼
                         ┌────────────────────┐
                         │   PostgreSQL       │
                         │ Canonical data     │
                         │ Graph relations    │
                         │ Search indexes     │
                         │ Learner state      │
                         └─────────┬──────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
             ┌────────────────┐         ┌────────────────┐
             │ Ingestion      │         │ AI Enrichment  │
             │ Workers        │         │ Optional       │
             └───────┬────────┘         └───────┬────────┘
                     │                          │
                     ▼                          ▼
               ┌───────────┐              ┌───────────┐
               │ PDF/OCR    │              │ AI Cache  │
               └───────────┘              └───────────┘
```

------------------------------------------------------------------------

# 5. Technology Direction

## 5.1 Backend

Primary:

-   Bun.js
-   TypeScript

Recommended role separation:

``` text
apps/
  api/
  worker/
  cli/

packages/
  domain/
  db/
  ingestion/
  search/
  learning/
  repository/
  ai/
```

------------------------------------------------------------------------

## 5.2 Database

Primary:

> PostgreSQL

Use PostgreSQL for:

-   users;
-   repositories;
-   versions;
-   source documents;
-   knowledge nodes;
-   relationships;
-   skills;
-   problems;
-   solutions;
-   questions;
-   exams;
-   learner state;
-   attempts;
-   recommendations;
-   annotations;
-   audit/provenance;
-   full-text search.

Optional later:

-   `pgvector` for semantic search.

Do not make vector search a hard dependency of the initial architecture.

------------------------------------------------------------------------

# 6. Domain Model

The domain is divided into five major graphs.

``` text
Knowledge Graph
    ↓
What exists?

Problem Graph
    ↓
How can problems be solved?

Learning Graph
    ↓
What should be learned and in what order?

Student Graph
    ↓
What does this student currently know?

Exam Graph
    ↓
What does an exam ecosystem measure?
```

------------------------------------------------------------------------

# 7. Core Entity Types

## 7.1 Base entity

``` ts
type ID = string

interface Entity {
  id: ID
  createdAt: Date
  updatedAt: Date
}
```

------------------------------------------------------------------------

## 7.2 Scope

``` ts
interface KnowledgeScope {
  id: ID

  curriculum?: string
  educationLevel?: string

  examType?: string
  region?: string

  validFrom?: Date
  validTo?: Date

  includedSkillIds?: ID[]
  excludedSkillIds?: ID[]

  parentScopeId?: ID
}
```

Examples:

``` text
THPT Mathematics
THPT Mathematics → Grade 12
THPT Mathematics → Grade 12 → Graduation Exam
THPT Mathematics → ĐGNL
University → Calculus I
```

------------------------------------------------------------------------

# 8. Knowledge Nodes

The core object should be generic.

``` ts
type KnowledgeNodeKind =
  | "concept"
  | "statement"
  | "definition"
  | "procedure"
  | "example"
  | "experiment"
  | "observation"
  | "claim"
  | "resource"
  | "skill"

interface KnowledgeNode extends Entity {
  kind: KnowledgeNodeKind

  title: string
  content: string

  scopeIds: ID[]

  sourceIds: ID[]

  confidence?: number

  status:
    | "draft"
    | "review"
    | "stable"
    | "deprecated"
}
```

The core model remains subject-neutral.

Subject-specific information can be added through extensions.

------------------------------------------------------------------------

# 9. Knowledge Relations

``` ts
type KnowledgeRelationType =
  | "depends_on"
  | "requires"
  | "supports"
  | "contradicts"
  | "proves"
  | "derived_from"
  | "explains"
  | "example_of"
  | "generalizes"
  | "specializes"
  | "applies_to"
  | "tested_by"
  | "solves"
  | "related_to"

interface KnowledgeRelation extends Entity {
  fromId: ID
  toId: ID
  type: KnowledgeRelationType

  confidence?: number
  sourceIds?: ID[]
}
```

Example:

``` text
AM-GM inequality
      │
      └── requires ──→ positive real numbers

Optimization
      │
      └── requires ──→ derivative
```

------------------------------------------------------------------------

# 10. Skills

A skill is not a question.

``` ts
interface Skill extends Entity {
  code: string
  name: string
  description?: string

  parentSkillId?: ID

  scopeIds: ID[]

  difficulty?: number
}
```

Example:

``` text
Mathematics
└── Algebra
    └── Inequalities
        └── AM-GM
```

But the hierarchy is only one relationship.

Skills may also have:

``` text
AM-GM
  depends_on → positive real numbers
  related_to → Cauchy-Schwarz
  tested_by → Problem P123
```

------------------------------------------------------------------------

# 11. Problems

Problems are first-class objects.

``` ts
interface Problem extends Entity {
  statement: string

  assumptions?: string[]
  goals?: string[]

  skillIds: ID[]

  scopeIds: ID[]

  solutionApproachIds: ID[]

  difficulty: DifficultyEstimate

  sourceIds: ID[]

  status:
    | "draft"
    | "review"
    | "stable"
    | "deprecated"
}
```

A problem can test multiple skills.

Example:

``` text
Problem:
Find max/min of f(x, y)

Skills:
- substitution
- derivatives
- inequalities
- optimization
```

------------------------------------------------------------------------

# 12. Multiple Solution Approaches

The system must support:

> One problem → many valid approaches.

``` ts
interface SolutionApproach extends Entity {
  problemId: ID

  title: string
  strategy: string

  steps: SolutionStep[]

  requiredSkillIds: ID[]

  applicability?: string

  pedagogicalProfile?: {
    algebraic?: boolean
    geometric?: boolean
    computational?: boolean
    conceptual?: boolean
  }

  sourceIds?: ID[]
}
```

``` ts
interface SolutionStep {
  order: number
  description: string

  inputKnowledgeIds?: ID[]
  outputKnowledgeIds?: ID[]

  skillIds?: ID[]
}
```

Example:

``` text
Problem:
maximize f(x,y)

Approach A:
  substitution

Approach B:
  Lagrange multipliers

Approach C:
  Cauchy-Schwarz
```

This enables evaluation of **method flexibility**, not only correctness.

------------------------------------------------------------------------

# 13. Problem Decomposition

Complex problems can contain subproblems.

``` ts
interface ProblemDependency {
  parentProblemId: ID
  childProblemId: ID

  relation:
    | "subproblem"
    | "prerequisite"
    | "lemma"
}
```

Example:

``` text
Olympiad Problem
   │
   ├── Prove Lemma A
   ├── Establish inequality B
   └── Apply result C
```

This creates a lightweight bridge toward formal reasoning systems such
as Lean without requiring the MVP to implement a theorem prover.

------------------------------------------------------------------------

# 14. Problem → Assessment Model

The previous `Question` model is too small for real educational formats.
In particular, a true/false question may contain several independent
statements, and each statement can test a different skill.

Use four layers:

``` text
Problem
   ↓
Assessment
   ↓
AssessmentItem(s)
   ↓
Attempt / ItemResult
   ↓
SkillState
```

## 14.1 Problem

A `Problem` is the semantic task/content to be solved. It should not
care how the learner is asked to answer it.

``` ts
interface Problem extends Entity {
  statement: string

  assumptions?: string[]
  goals?: string[]

  skillIds: ID[]
  scopeIds: ID[]

  solutionApproachIds: ID[]

  difficulty: DifficultyEstimate

  sourceIds: ID[]

  status:
    | "draft"
    | "review"
    | "stable"
    | "deprecated"
}
```

## 14.2 Assessment

An `Assessment` is one concrete way to evaluate a Problem. The same
Problem can have multiple assessments.

``` ts
type AssessmentType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "matching"
  | "ordering"
  | "short_answer"
  | "numeric"
  | "fill_blank"
  | "proof"
  | "free_response"

type EvaluationType =
  | "exact"
  | "boolean"
  | "numeric_tolerance"
  | "partial_credit"
  | "rubric"
  | "human_review"
  | "ai_assisted"

interface Assessment extends Entity {
  problemId: ID

  type: AssessmentType
  prompt: string

  items: AssessmentItem[]

  evaluation: EvaluationPolicy

  explanation?: string
  hintIds?: ID[]

  sourceIds: ID[]
  scopeIds: ID[]
  skillIds: ID[]

  eligibility?: AssessmentEligibility
}
```

## 14.3 AssessmentItem

`AssessmentItem` is the atomic unit that can produce evidence about a
skill. Most simple questions have one item; compound formats can have
many.

``` ts
type AssessmentItemType =
  | "choice"
  | "boolean"
  | "text"
  | "numeric"
  | "blank"
  | "ordering"
  | "matching"
  | "proof"

interface AssessmentItem extends Entity {
  assessmentId: ID

  type: AssessmentItemType
  prompt: string

  answer: unknown

  skillIds: ID[]
  difficulty?: DifficultyEstimate

  weight?: number
  explanation?: string
}
```

## 14.4 True/False is a multi-item assessment

Do not model true/false as merely another single choice.

``` ts
interface TrueFalseItem extends AssessmentItem {
  type: "boolean"

  answer: boolean
}
```

Example:

``` text
Problem P123: Analyze a function f(x)

Assessment A123: True / False
  Item 1: f is continuous on [0,1]      → true  → continuity skill
  Item 2: f has a maximum at x = 0       → false → extrema skill
  Item 3: f'(x) > 0 for all x            → true  → derivative skill
  Item 4: f is injective                 → false → function reasoning
```

If the student gets 1 and 3 correct but 2 and 4 wrong, the system should
update the corresponding skills separately instead of marking the entire
Problem simply "wrong".

## 14.5 One Problem, many assessments

``` text
Problem P123
  ├── Assessment A1: multiple choice
  ├── Assessment A2: true/false
  ├── Assessment A3: numeric answer
  ├── Assessment A4: short answer
  └── Assessment A5: proof
```

This prevents content duplication and lets the learning engine vary
cognitive demand while preserving the same underlying knowledge.

## 14.6 Evaluation is separate from assessment format

``` ts
interface EvaluationPolicy {
  type: EvaluationType

  config?: unknown
}
```

Examples:

``` text
multiple_choice + exact
true_false + partial_credit
numeric + numeric_tolerance
proof + rubric
free_response + human_review
```

Scoring therefore belongs to the evaluation policy, not directly to the
question type.

## 14.7 Attempts store item-level evidence

``` ts
interface Attempt extends Entity {
  studentId: ID
  assessmentId: ID

  startedAt: Date
  submittedAt: Date

  result: AssessmentResult

  hintsUsed: number
  solutionApproachUsed?: ID
}

interface AssessmentResult {
  status: "correct" | "incorrect" | "partial" | "skipped"

  score: number
  maxScore: number

  itemResults: ItemResult[]
}

interface ItemResult {
  itemId: ID
  answer: unknown

  isCorrect?: boolean
  score: number
  maxScore: number
}
```

This is important for adaptive learning: `ItemResult` is the bridge from
an answer to precise skill evidence.

## 14.8 Skill updates

The learning engine should aggregate evidence roughly as:

``` text
ItemResult
   ↓
item.skillIds
   ↓
SkillState update
   ↓
mastery / confidence / review priority
```

The exact mastery algorithm can remain simple in MVP.

------------------------------------------------------------------------

# 15. Difficulty

Difficulty must not be a permanent magic number.

``` ts
interface DifficultyEstimate {
  value: number

  uncertainty: number

  sampleSize: number

  status:
    | "estimated"
    | "calibrating"
    | "stable"

  source:
    | "manual"
    | "heuristic"
    | "student-data"
    | "ai"
}
```

The system can later use:

-   ELO-like calibration;
-   Bayesian estimation;
-   IRT;
-   simpler success-rate models.

Do not over-engineer this in the first phase.

------------------------------------------------------------------------

# 16. Student Model

The central learner state is skill-based.

``` ts
interface SkillState {
  studentId: ID
  skillId: ID

  mastery: number
  confidence: number

  attempts: number
  correctAttempts: number

  lastPracticedAt?: Date

  forgettingEstimate?: number

  updatedAt: Date
}
```

This allows:

``` text
Student
  ├── algebra: 0.82
  ├── inequalities: 0.64
  ├── derivatives: 0.91
  └── optimization: 0.42
```

Instead of:

``` text
Question 123 = known
Question 124 = unknown
```

------------------------------------------------------------------------

# 17. Attempt and Learning Evidence

Attempts are defined in the Problem → Assessment model above. The
important design decision is that an attempt stores **item-level
results**, while the aggregate assessment result is derived from those
items and its `EvaluationPolicy`.

Attempts become training/calibration data for:

-   student mastery;
-   confidence;
-   difficulty calibration;
-   response-time analysis;
-   hint effectiveness;
-   solution-approach preference;
-   question quality detection.

------------------------------------------------------------------------

# 18. Pedagogy

## 18.1 Polya-based hint system

Hints should follow George Pólya's four stages:

``` text
1. Understand the problem
2. Devise a plan
3. Carry out the plan
4. Look back
```

Model:

``` ts
type HintStage =
  | "understand"
  | "plan"
  | "execute"
  | "review"

interface Hint extends Entity {
  problemId: ID

  stage: HintStage

  level: number

  content: string

  source:
    | "human"
    | "rule"
    | "ai"
}
```

Hint levels should increase information leakage.

Example:

``` text
Level 1:
What quantities are known?

Level 2:
Can you rewrite the condition using a known identity?

Level 3:
Try expressing y in terms of x.

Level 4:
Substitute y = ...
```

The system should avoid immediately revealing the solution.

------------------------------------------------------------------------

# 19. Learning Graph

The Knowledge Graph says:

> What exists?

The Learning Graph says:

> What should this learner learn next?

It can be represented through policies rather than another physical
database graph.

Example:

``` text
Derivative
   ↓
Derivative applications
   ↓
Optimization
   ↓
Constrained optimization
```

Prerequisites can be represented using normal PostgreSQL relations.

------------------------------------------------------------------------

# 20. Scope Engine

The scope engine prevents scope drift.

## 20.1 Scope drift examples

Bad:

``` text
Student preparing for THPT graduation
    ↓
gets random Calculus II question
```

Bad:

``` text
Student preparing for ĐGNL
    ↓
system finds "hard math"
    ↓
serves unrelated university mathematics
```

Better:

``` text
Target Scope
    ↓
Core skills
    ↓
Adjacent skills
    ↓
Transfer skills
    ↓
Experimental challenge
```

------------------------------------------------------------------------

# 21. Curriculum Expansion Radius

A useful rule:

``` text
mastery < 0.60
    → stay inside target scope

0.60 ≤ mastery < 0.80
    → adjacent concepts

0.80 ≤ mastery < 0.90
    → transfer problems

mastery ≥ 0.90
    → controlled challenge / experimental material
```

These numbers are configurable.

The important principle is:

> Expansion should be intentional and explainable.

------------------------------------------------------------------------

# 22. Exam System

Exams are not just collections of random questions.

``` ts
interface ExamBlueprint {
  id: ID

  title: string

  scopeId: ID

  timeLimitMinutes: number

  skillDistribution: SkillDistribution[]

  difficultyDistribution: DifficultyDistribution[]

  historicalWeighting?: HistoricalWeighting

  experimentalQuestionCount?: number
}
```

------------------------------------------------------------------------

# 23. Historical Weighting

Recent exams should usually have more influence.

``` ts
interface HistoricalWeighting {
  referenceYear: number

  decay: number

  minimumWeight: number
}
```

Conceptually:

``` text
2026 → very high
2025 → high
2024 → medium
2020 → lower
2015 → low
```

But time distance should not be the only variable.

Historical similarity should also consider:

-   curriculum;
-   exam format;
-   skill distribution;
-   question style;
-   scoring rules.

------------------------------------------------------------------------

# 24. Difficulty Expansion

Once core material is mastered:

``` text
Core
 ↓
Near-core
 ↓
Transfer
 ↓
Hard transfer
 ↓
Experimental
```

Example:

``` text
Student masters standard derivative questions
        ↓
optimization
        ↓
unusual optimization formulation
        ↓
cross-topic optimization
        ↓
experimental difficult problem
```

------------------------------------------------------------------------

# 25. Experimental Questions

Experimental questions can be inserted without affecting official
scores.

``` ts
interface ExperimentalQuestion {
  questionId: ID

  scoreWeight: 0

  calibrationPurpose:
    | "difficulty"
    | "skill"
    | "transfer"
    | "novelty"
}
```

Their purpose is to estimate:

-   actual difficulty;
-   student ability;
-   transfer ability;
-   whether a question is unexpectedly easy/hard.

------------------------------------------------------------------------

# 26. Exam Graph

The exam ecosystem can be modeled as:

``` text
Exam
 ├── year
 ├── format
 ├── scope
 ├── skills
 ├── difficulty
 └── questions
```

Over time:

``` text
Exam 2022
Exam 2023
Exam 2024
Exam 2025
Exam 2026
```

The system can learn:

``` text
skill frequency
difficulty distribution
question archetypes
topic trends
format changes
```

------------------------------------------------------------------------

# 27. Search Architecture

Start simple.

## Stage 1

Use PostgreSQL:

-   full-text search;
-   trigram similarity;
-   structured filters;
-   exact matching;
-   graph traversal.

Example query:

``` text
scope = THPT
AND skill = inequalities
AND difficulty BETWEEN 0.4 AND 0.7
AND exam_year >= 2022
```

## Stage 2

Add embeddings only where semantic search provides measurable value.

Potential stack:

``` text
PostgreSQL
+
pgvector
```

Embedding data remains derived.

------------------------------------------------------------------------

# 28. Retrieval Strategy

Avoid:

``` text
query
 ↓
random PDF chunk
```

Prefer:

``` text
query
 ↓
scope filter
 ↓
skill filter
 ↓
problem / concept candidates
 ↓
lexical ranking
 ↓
optional semantic ranking
 ↓
graph expansion
 ↓
meaningful result
```

A result should preferably be:

-   a complete problem;
-   a complete concept;
-   a definition;
-   a theorem;
-   a solution approach;
-   a source section.

Not arbitrary token chunks.

------------------------------------------------------------------------

# 29. Repository Architecture

A repository should behave similarly to GitHub.

``` ts
interface Repository extends Entity {
  ownerId: ID

  name: string
  description?: string

  visibility: "public" | "private"

  defaultBranch: string
}
```

Content should be versioned.

``` ts
interface RepositoryVersion extends Entity {
  repositoryId: ID

  branch: string
  commitHash: string

  message: string

  parentCommitHash?: string

  authorId: ID
}
```

------------------------------------------------------------------------

# 30. Pull Requests

``` ts
interface PullRequest extends Entity {
  repositoryId: ID

  authorId: ID

  sourceBranch: string
  targetBranch: string

  title: string
  description?: string

  status:
    | "open"
    | "merged"
    | "closed"

  mergedAt?: Date
}
```

Possible contributions:

``` text
Add 10 problems
Fix incorrect solution
Correct skill classification
Add prerequisite
Add chemistry experiment
Improve explanation
```

------------------------------------------------------------------------

# 31. Issues

``` ts
interface Issue extends Entity {
  repositoryId: ID

  authorId: ID

  title: string
  body: string

  type:
    | "bug"
    | "content"
    | "classification"
    | "quality"
    | "request"

  status:
    | "open"
    | "closed"
}
```

------------------------------------------------------------------------

# 32. Provenance

``` ts
interface Provenance {
  sourceType:
    | "pdf"
    | "web"
    | "human"
    | "rule"
    | "ai"
    | "student-data"

  sourceId?: ID

  page?: number

  locator?: string

  extractedAt?: Date
}
```

Every AI annotation should keep provenance.

------------------------------------------------------------------------

# 33. Annotation System

``` ts
interface Annotation<T> {
  value: T

  source:
    | "human"
    | "rule"
    | "ai"
    | "derived"
    | "student-data"

  confidence?: number

  provenance: Provenance[]

  version: number
}
```

Example:

``` text
Problem P123
skill = optimization

source = ai
confidence = 0.73
status = suggested
```

After human review:

``` text
skill = optimization

source = human
confidence = 1.0
status = canonical
```

------------------------------------------------------------------------

# 34. PDF Ingestion Pipeline

This is one of the highest-priority parts of the MVP because the initial
corpus is mostly PDFs.

Think like a compiler.

``` text
PDF
 ↓
Lexer
 ↓
Blocks
 ↓
Parser
 ↓
Semantic units
 ↓
Canonical entities
 ↓
Validation
 ↓
Repository
```

------------------------------------------------------------------------

# 35. Ingestion Stages

## Stage 0 --- File

Input:

``` text
exam-2025.pdf
```

Store:

-   hash;
-   filename;
-   size;
-   source;
-   upload time.

------------------------------------------------------------------------

## Stage 1 --- Extraction

Extract:

-   text;
-   pages;
-   images;
-   layout;
-   coordinates if available.

No AI required.

------------------------------------------------------------------------

## Stage 2 --- Normalization

Normalize:

-   whitespace;
-   Unicode;
-   equations;
-   page headers;
-   footers;
-   repeated metadata.

------------------------------------------------------------------------

## Stage 3 --- Question Segmentation

Detect:

``` text
Question 1
Question 2
...
```

Use:

-   numbering patterns;
-   layout;
-   answer blocks;
-   section headings;
-   deterministic heuristics.

------------------------------------------------------------------------

## Stage 4 --- Question Structure

Convert:

``` text
raw PDF text
```

into:

``` ts
interface ExtractedQuestion {
  sourceDocumentId: ID
  pageStart: number
  pageEnd: number

  number?: string

  statement: string

  options?: string[]

  answer?: string

  rawText: string
}
```

------------------------------------------------------------------------

# 36. Semantic Enrichment

Only after deterministic extraction should AI be considered.

Potential AI fields:

``` text
skills
difficulty
concepts
prerequisites
question archetype
solution approach
explanation
hints
```

AI should only be called for:

-   low-confidence classification;
-   missing semantic fields;
-   complex problems;
-   new problem types.

------------------------------------------------------------------------

# 37. Ingestion Confidence

Every extraction stage should emit confidence.

Example:

``` text
Question segmentation: 0.98
Answer extraction:     0.91
Skill classification:  0.62
Difficulty:            0.45
```

The system can decide:

``` text
confidence >= 0.90
    → auto accept

0.70–0.90
    → accept + review queue

< 0.70
    → manual review / AI retry
```

Thresholds should be configurable.

------------------------------------------------------------------------

# 38. AI Cost Control

This is a core architecture constraint.

## Rule 1

Never call AI during every user interaction unless necessary.

Bad:

``` text
Student answers
 ↓
AI evaluates
 ↓
AI recommends
 ↓
AI generates next question
```

Better:

``` text
Student answers
 ↓
deterministic mastery update
 ↓
database query
 ↓
policy engine
 ↓
next question
```

------------------------------------------------------------------------

## Rule 2

Cache AI results.

``` ts
interface AIArtifact extends Entity {
  inputHash: string

  model: string
  modelVersion?: string

  task:
    | "classification"
    | "skill_mapping"
    | "solution"
    | "hint"
    | "explanation"
    | "generation"

  output: unknown

  confidence?: number

  cost?: {
    inputTokens?: number
    outputTokens?: number
  }
}
```

Same input + same task should normally reuse cached output.

------------------------------------------------------------------------

## Rule 3

Batch enrichment

Instead of:

``` text
1000 questions
→ 1000 independent calls
```

Prefer:

``` text
1000 questions
→ deterministic preprocessing
→ group similar questions
→ batch AI enrichment
→ cache results
```

------------------------------------------------------------------------

## Rule 4

Budget-aware processing

``` ts
interface AIBudget {
  maxCalls: number
  maxInputTokens?: number
  maxOutputTokens?: number

  priority:
    | "quality"
    | "balanced"
    | "cost"
}
```

When the budget is exhausted:

``` text
AI enrichment stops
```

but:

``` text
PDF ingestion continues
```

The system should degrade gracefully.

------------------------------------------------------------------------

# 39. AI Priority Queue

Suggested priority:

``` text
P0
  broken extraction / ambiguous structure

P1
  skill classification

P2
  prerequisite inference

P3
  solution decomposition

P4
  hints

P5
  explanation

P6
  novel question generation
```

For the MVP, focus mostly on P0--P3.

------------------------------------------------------------------------

# 40. No Full Reindexing

When the AI model changes:

Bad:

``` text
change model
 ↓
reprocess 100,000 questions
```

Better:

``` text
new model
 ↓
find:
  low-confidence items
  disputed items
  newly imported items
  old model artifacts
 ↓
incremental reprocessing
```

------------------------------------------------------------------------

# 41. AI vs Human Workflow

``` text
AI suggestion
     ↓
review queue
     ↓
human correction
     ↓
canonical content
     ↓
future training/calibration data
```

This turns contributors into a quality-control system.

------------------------------------------------------------------------

# 42. Learning Session Engine

A session should be policy-driven.

``` ts
interface LearningSession {
  id: ID

  studentId: ID

  scopeId: ID

  mode:
    | "practice"
    | "review"
    | "rush"
    | "micro"
    | "exam"

  items: SessionItem[]
}
```

``` ts
interface SessionItem {
  questionId: ID

  reason:
    | "weak_skill"
    | "review"
    | "target"
    | "challenge"
    | "experimental"
    | "historical"
}
```

------------------------------------------------------------------------

# 43. Adaptive Selection

Candidate generation:

``` text
1. Filter by scope
2. Filter excluded skills
3. Identify weak skills
4. Identify forgotten skills
5. Identify target skills
6. Find suitable difficulty
7. Consider historical relevance
8. Consider diversity
9. Select question
```

Then explain:

``` text
Why this question?

- Your mastery of optimization is low.
- You last practiced it 8 days ago.
- This problem is slightly above your current estimated level.
```

------------------------------------------------------------------------

# 44. Session Composition

Do not hardcode a permanent ratio.

Possible initial policy:

``` text
Warm-up       10%
Target        50%
Review        20%
Challenge     15%
Experimental   5%
```

But the policy should adapt.

Example:

``` text
student weak
→ more target/review

student strong
→ more challenge/transfer

exam approaching
→ more exam-like questions
```

------------------------------------------------------------------------

# 45. Rush Review Mode

Rush mode is a projection of the same graph.

It should:

1.  identify high-value skills;
2.  prioritize weak + important concepts;
3.  show concise theory;
4.  immediately provide micro-practice;
5.  repeat unstable skills.

Flow:

``` text
Skill
 ↓
30–90 sec concept preview
 ↓
1 easy problem
 ↓
1 representative problem
 ↓
1 check problem
 ↓
next skill
```

------------------------------------------------------------------------

# 46. Micro-Practice / Bus Mode

Designed for short sessions.

Constraints:

``` text
1–5 minutes
```

Each item should be small:

-   identify method;
-   choose next step;
-   recall formula;
-   classify concept;
-   solve one substep;
-   estimate answer;
-   detect mistake.

This should reuse existing Problems and SolutionSteps rather than
requiring new content.

------------------------------------------------------------------------

# 47. Multi-Approach Evaluation

If a problem supports:

``` text
Approach A
Approach B
Approach C
```

the system can observe:

``` text
Which approach does the student use?
Can they recognize another approach?
Can they switch methods?
```

Potential future metric:

``` text
method_flexibility
```

Do not use it as a high-stakes score initially.

------------------------------------------------------------------------

# 48. Recommendation Explainability

Every recommendation should have a reason.

``` ts
interface RecommendationReason {
  type:
    | "weak_skill"
    | "forgotten_skill"
    | "scope_target"
    | "difficulty_fit"
    | "exam_relevance"
    | "historical_relevance"
    | "method_diversity"

  weight: number

  explanation: string
}
```

Avoid:

> AI recommended this.

Prefer:

> This problem targets inequalities, which is currently one of your
> weakest skills and appeared frequently in recent target exams.

------------------------------------------------------------------------

# 49. PostgreSQL Schema Direction

Initial relational model:

``` text
users
repositories
repository_versions

source_documents
source_pages
source_blocks

knowledge_nodes
knowledge_relations
skills

problems
solution_approaches
solution_steps
problem_dependencies

problems
solution_approaches
solution_steps
problem_dependencies

assessments
assessment_items
assessment_item_options

evaluation_policies

scopes
scope_skills

exams
exam_questions
exam_blueprints

students
skill_states
attempts

hints

annotations
ai_artifacts
provenance

issues
pull_requests
```

------------------------------------------------------------------------

# 50. Suggested PostgreSQL Relationships

``` text
repositories
  └── repository_versions

source_documents
  └── source_pages
       └── source_blocks

knowledge_nodes
  ├── knowledge_relations
  ├── annotations
  └── provenance

problems
  ├── problem_skills
  ├── solution_approaches
  │    └── solution_steps
  ├── problem_dependencies
  └── questions

students
  ├── skill_states
  └── attempts
       └── questions

exams
  └── exam_questions
```

Use join tables for many-to-many relations.

------------------------------------------------------------------------

# 51. Database Rules

## Rule: IDs

Use stable opaque IDs.

Do not expose semantic database IDs as business logic.

------------------------------------------------------------------------

## Rule: Soft deletion

Important canonical entities should preferably use:

``` ts
deletedAt?: Date
```

instead of destructive deletion.

------------------------------------------------------------------------

## Rule: Versioning

Content modifications should be traceable.

------------------------------------------------------------------------

## Rule: Constraints

Use PostgreSQL constraints for invariants.

Example:

``` text
attempt.student_id must exist
problem.scope_id must exist
solution_approach.problem_id must exist
```

Do not rely exclusively on TypeScript validation.

------------------------------------------------------------------------

# 52. Search Indexes

Initial PostgreSQL indexes:

``` text
skills(code)
skills(parent_skill_id)

problems(status)
problems(scope_id)
problems(difficulty)

questions(problem_id)

attempts(student_id, submitted_at)

skill_states(student_id, skill_id)

source_documents(hash)

annotations(input_hash)
```

Add full-text indexes after measuring real queries.

------------------------------------------------------------------------

# 53. Repository Content vs Runtime Data

Separate:

### Content

``` text
Repository
Knowledge
Problems
Solutions
Questions
Sources
```

### Runtime

``` text
Student
Attempts
Mastery
Recommendations
Session
```

This makes content reusable across many students.

------------------------------------------------------------------------

# 54. API Direction

Bun.js API modules:

``` text
/auth
/repositories
/knowledge
/skills
/problems
/questions
/search
/sessions
/students
/exams
/ingestion
/contributions
```

Example:

``` http
GET /problems?skill=optimization&scope=thpt
```

``` http
POST /attempts
```

``` http
POST /sessions
```

``` http
POST /repositories/:id/pulls
```

------------------------------------------------------------------------

# 55. Worker Architecture

Do not make ingestion run inside request handlers.

``` text
API
 ↓
Job
 ↓
Worker
 ↓
PostgreSQL
```

Jobs:

``` text
extract_pdf
normalize_document
segment_questions
extract_answers
classify_skills
infer_prerequisites
generate_hints
recalculate_difficulty
build_search_projection
```

Bun workers/processes can initially be simple.

A dedicated queue system can be introduced only when necessary.

------------------------------------------------------------------------

# 56. Event-Oriented Flow

Important events:

``` text
document.uploaded
problem.extracted
assessment.extracted
assessment.normalized
annotation.created
annotation.reviewed
problem.created
attempt.submitted
skill.mastery.updated
exam.completed
```

Initially these can be represented as ordinary jobs/events in
PostgreSQL.

Do not introduce Kafka for MVP.

------------------------------------------------------------------------

# 57. Example: Import an Exam PDF

``` text
User uploads exam.pdf
        ↓
store document
        ↓
calculate SHA-256
        ↓
extract text/layout
        ↓
split pages
        ↓
detect problems/assessments
        ↓
extract options/answers/items
        ↓
create Problem + Assessment + AssessmentItems
        ↓
assign source provenance
        ↓
rule-based skill classification
        ↓
AI only for uncertain questions
        ↓
review queue
        ↓
stable repository content
```

------------------------------------------------------------------------

# 58. Example: Student Solves a Question

``` text
Student opens Assessment A123
        ↓
submit item responses
        ↓
deterministic evaluation per item
        ↓
create Attempt + ItemResults
        ↓
update SkillState from item skill mappings
        ↓
update difficulty calibration
        ↓
query next candidates
        ↓
apply scope
        ↓
apply learning policy
        ↓
select next problem
```

No AI call is required.

------------------------------------------------------------------------

# 59. Example: Student Requests a Hint

First try:

``` text
stored hint
```

If available:

``` text
return cached hint
```

If unavailable:

``` text
check deterministic hint templates
```

Only then:

``` text
AI generation
 ↓
cache
 ↓
return
```

------------------------------------------------------------------------

# 60. Example: Generate an Exam

``` text
Exam blueprint
      ↓
scope filter
      ↓
required skill distribution
      ↓
historical weighting
      ↓
difficulty constraints
      ↓
question candidates
      ↓
duplicate/topic similarity filtering
      ↓
experimental insertion
      ↓
final exam
```

No generative AI is required if enough canonical questions exist.

------------------------------------------------------------------------

# 61. Example: Personal Recommendation

Input:

``` text
student mastery
target scope
exam date
recent attempts
forgetting estimates
exam skill distribution
```

Output:

``` text
1. Optimization — review
2. Inequality — target practice
3. Probability — challenge
4. Derivative — micro review
```

Reason for each item is stored.

------------------------------------------------------------------------

# 62. Content Quality Pipeline

Each content item can have:

``` text
extraction quality
semantic quality
skill quality
solution quality
source quality
```

Example:

``` text
Problem P123

Extraction: 0.99
Skill:      0.81
Solution:   0.95
Difficulty: 0.61
```

This helps prioritize human review.

------------------------------------------------------------------------

# 63. Subject Plugin System

The core should remain generic.

``` ts
interface SubjectPlugin {
  id: string

  validate(node: KnowledgeNode): ValidationResult

  enrich(node: KnowledgeNode): unknown

  classify(problem: Problem): SkillCandidate[]
}
```

Examples:

``` text
math
chemistry
physics
history
language
```

------------------------------------------------------------------------

# 64. Mathematics Plugin

Potential specialized entities:

``` text
definition
theorem
lemma
proof
identity
formula
method
counterexample
```

Example:

``` text
AM-GM
  requires → positive numbers
  generalizes → weighted AM-GM
  tested_by → Problem P123
```

------------------------------------------------------------------------

# 65. Chemistry Plugin

Potential relationships:

``` text
experiment
  ↓
observation
  ↓
claim
  ↓
reaction
```

Example:

``` text
Experiment:
add reagent X

Observation:
solution changes color

Conclusion:
compound Y may be present
```

------------------------------------------------------------------------

# 66. History Plugin

Potential structure:

``` text
Source
 ↓
Evidence
 ↓
Claim
 ↓
Interpretation
```

This avoids forcing all disciplines into mathematical theorem
structures.

------------------------------------------------------------------------

# 67. Why PostgreSQL First?

Advantages:

-   mature;
-   transactional;
-   relational constraints;
-   JSONB for flexible fields;
-   full-text search;
-   recursive queries;
-   extensions;
-   pgvector later;
-   easy local development;
-   easy deployment;
-   one database for MVP.

Graph-like queries can initially be implemented with:

``` sql
WITH RECURSIVE ...
```

and indexed relations.

------------------------------------------------------------------------

# 68. Why Bun.js?

Bun fits the project because:

-   TypeScript-first workflow;
-   fast runtime;
-   built-in tooling;
-   simple worker/CLI story;
-   good developer experience.

The architecture should nevertheless keep domain logic independent of
Bun-specific APIs where practical.

------------------------------------------------------------------------

# 69. Project Structure

Suggested monorepo:

``` text
learning-platform/
├── apps/
│   ├── api/
│   ├── worker/
│   └── web/
│
├── packages/
│   ├── domain/
│   ├── db/
│   ├── repository/
│   ├── ingestion/
│   ├── learning/
│   ├── search/
│   ├── ai/
│   └── shared/
│
├── migrations/
├── scripts/
├── docs/
│
├── package.json
├── bun.lock
└── README.md
```

------------------------------------------------------------------------

# 70. Domain Package Rule

`packages/domain` should not depend on:

-   PostgreSQL;
-   HTTP;
-   AI provider;
-   UI.

It contains:

-   types;
-   policies;
-   pure algorithms;
-   validation;
-   domain rules.

This keeps the core testable.

------------------------------------------------------------------------

# 71. Database Package

Responsibilities:

``` text
schema
migrations
queries
repositories
transactions
search indexes
```

Do not leak raw SQL everywhere.

------------------------------------------------------------------------

# 72. Learning Package

Responsibilities:

``` text
mastery update
difficulty update
candidate selection
session planning
scope filtering
review scheduling
recommendation reasoning
```

This should work without AI.

------------------------------------------------------------------------

# 73. AI Package

Responsibilities:

``` text
provider abstraction
prompt templates
structured outputs
caching
budgets
retry policy
model selection
AI provenance
```

Example:

``` ts
interface AIProvider {
  generate<T>(
    task: AITask,
    input: unknown
  ): Promise<T>
}
```

The domain must not care which model is used.

------------------------------------------------------------------------

# 74. Ingestion Package

Responsibilities:

``` text
PDF parsing
OCR integration
layout normalization
question segmentation
answer extraction
semantic unit extraction
canonicalization
validation
```

------------------------------------------------------------------------

# 75. MVP Philosophy

The MVP should **not** attempt to build:

-   a perfect universal ontology;
-   a full graph database;
-   a full theorem prover;
-   fully autonomous AI tutoring;
-   perfect personalized learning;
-   automatic generation of all educational content.

The MVP should prove:

> We can turn a large exam PDF corpus into reliable structured problems
> and assessments, then use item-level skill evidence to provide
> genuinely useful adaptive practice.

------------------------------------------------------------------------

# 76. MVP Phase 0 --- Foundations

### Goal

Create the engineering skeleton.

### Deliverables

``` text
Bun.js monorepo
PostgreSQL
migration system
domain package
API
worker
logging
configuration
tests
```

### Success criteria

``` text
bun dev
bun test
database migration works
API can query database
worker can process a job
```

------------------------------------------------------------------------

# 77. MVP Phase 1 --- PDF → Question

### Highest priority.

Build:

``` text
PDF
 ↓
pages
 ↓
blocks
 ↓
questions
 ↓
answers
 ↓
source provenance
```

No sophisticated AI required.

### Deliverables

-   document table;
-   page table;
-   block table;
-   question extraction;
-   answer extraction;
-   source location;
-   deterministic validation.

### Success metric

A human should be able to inspect imported questions and trust their
structure.

------------------------------------------------------------------------

# 78. MVP Phase 2 --- Canonical Problem Model

Convert extracted content into:

``` text
Problem
Assessment
AssessmentItem(s)
Source
Scope
Skill
```

Add:

-   deduplication at Problem level;
-   normalized statements;
-   assessment-format detection;
-   per-item answer extraction;
-   per-item skill mapping;
-   source provenance;
-   manual correction.

### Important

A compound assessment must not lose its internal structure during
ingestion. For example, a four-statement True/False question becomes one
Problem + one Assessment + four AssessmentItems, not one opaque blob.

### Important

Do not create a huge ontology.

Start with a small skill taxonomy.

------------------------------------------------------------------------

# 79. MVP Phase 3 --- Search

Implement:

``` text
scope filter
skill filter
difficulty filter
year filter
text search
```

Use PostgreSQL first.

Example:

``` text
Find:
THPT
optimization
2022–2026
medium difficulty
```

Only add vector search if lexical/structured retrieval is insufficient.

------------------------------------------------------------------------

# 80. MVP Phase 4 --- Student State

Implement:

``` text
Student
Attempt
SkillState
```

Initial mastery algorithm can be simple.

Example:

``` text
correct + appropriate difficulty
    → mastery increases

incorrect
    → mastery decreases

long time without practice
    → review priority increases
```

Do not start with complicated IRT.

------------------------------------------------------------------------

# 81. MVP Phase 5 --- Adaptive Practice

Implement:

``` text
weak skill
+
target scope
+
appropriate difficulty
+
review timing
```

Then generate sessions.

Example:

``` text
10 questions

2 review
5 target
2 challenge
1 experimental
```

The exact ratio should be configurable.

------------------------------------------------------------------------

# 82. MVP Phase 6 --- Exam Generator

Implement:

``` text
blueprint
 ↓
skill distribution
 ↓
historical weighting
 ↓
difficulty
 ↓
question selection
```

Include experimental questions with zero score weight.

------------------------------------------------------------------------

# 83. MVP Phase 7 --- AI Enrichment

Only now introduce AI heavily enough to matter.

Use AI for:

``` text
uncertain skill classification
solution approaches
prerequisite suggestions
hints
```

All outputs:

``` text
cached
versioned
confidence-scored
reviewable
```

------------------------------------------------------------------------

# 84. MVP Phase 8 --- Repository Contributions

Add:

``` text
repositories
branches
commits
issues
pull requests
review
```

Initially contribution can be simple:

``` text
submit JSON/content patch
 ↓
review
 ↓
merge
```

Do not implement a full Git engine.

------------------------------------------------------------------------

# 85. Phase 9 --- Learning Experience

Build:

-   theory preview;
-   rush mode;
-   micro-practice;
-   Polya hints;
-   multiple solution approaches;
-   progress dashboard.

These are projections over existing data.

------------------------------------------------------------------------

# 86. Phase 10 --- Semantic Search

Only after collecting real search failures.

Add:

``` text
pgvector
embedding cache
hybrid ranking
```

Pipeline:

``` text
structured filter
 ↓
BM25/full-text
 ↓
vector similarity
 ↓
graph expansion
 ↓
reranking
```

------------------------------------------------------------------------

# 87. Phase 11 --- Advanced Calibration

Later:

-   ELO-like question calibration;
-   IRT;
-   Bayesian skill estimates;
-   better forgetting models;
-   transfer metrics;
-   method flexibility metrics.

Only introduce complexity when enough student interaction data exists.

------------------------------------------------------------------------

# 88. Phase 12 --- Cross-Subject Expansion

Once the mathematics pipeline works:

``` text
Math
 ↓
Chemistry
 ↓
Physics
 ↓
History
 ↓
Language
```

Reuse:

``` text
Repository
KnowledgeNode
Provenance
Annotation
Scope
Problem
StudentState
```

Subject plugins supply specialized semantics.

------------------------------------------------------------------------

# 89. 1--2 Month MVP Roadmap

If the team has roughly 4--8 weeks:

## Week 1

``` text
architecture
PostgreSQL
Bun.js
schema
monorepo
document ingestion skeleton
```

## Week 2

``` text
PDF extraction
question segmentation
answer extraction
provenance
manual review UI
```

## Week 3

``` text
Problem
Question
Skill
Scope
search
deduplication
```

## Week 4

``` text
Student
Attempt
SkillState
basic mastery
basic review
```

## Week 5

``` text
adaptive sessions
difficulty calibration
exam blueprint
exam generation
```

## Week 6

``` text
AI enrichment
skill classification
cached hints
solution approaches
```

## Week 7

``` text
repository
contribution
issues
pull requests
quality review
```

## Week 8

``` text
polish
analytics
performance
testing
deployment
real-user evaluation
```

------------------------------------------------------------------------

# 90. What NOT to Build in the First 2 Months

Avoid:

``` text
❌ graph database
❌ Kafka
❌ microservice explosion
❌ full theorem prover
❌ autonomous AI tutor
❌ automatic perfect ontology
❌ full vector-search-first architecture
❌ complicated IRT
❌ fully automatic curriculum discovery
❌ generating thousands of synthetic questions
❌ processing every PDF with AI
```

Instead:

``` text
✅ reliable extraction
✅ canonical questions
✅ source provenance
✅ scope
✅ skills
✅ adaptive practice
✅ basic exam generation
✅ human review
```

------------------------------------------------------------------------

# 91. Cost Strategy

## Infrastructure

Prefer:

``` text
1 PostgreSQL
1 Bun API
1 Bun worker
1 frontend
```

before splitting services.

------------------------------------------------------------------------

## AI

Use:

``` text
AI only when ambiguity is expensive
```

rather than:

``` text
AI everywhere
```

------------------------------------------------------------------------

## Storage

Store original PDFs separately from structured records.

Database stores:

``` text
metadata
references
structured content
```

Object storage/filesystem stores:

``` text
PDF
images
large artifacts
```

------------------------------------------------------------------------

# 92. Cost-aware Processing Example

Suppose:

``` text
10,000 questions
```

Do:

``` text
10,000 → deterministic extraction
10,000 → rule-based classification
 2,000 → uncertain
 2,000 → AI enrichment
```

instead of:

``` text
10,000 → AI
```

If human review improves 500 classifications, those corrections become
permanent canonical data.

------------------------------------------------------------------------

# 93. Data Lifecycle

``` text
RAW
 ↓
EXTRACTED
 ↓
NORMALIZED
 ↓
CLASSIFIED
 ↓
REVIEWED
 ↓
STABLE
 ↓
DERIVED
 ↓
CALIBRATED
```

Each stage should be observable.

------------------------------------------------------------------------

# 94. Data Quality States

Possible:

``` ts
type ContentStatus =
  | "raw"
  | "extracted"
  | "normalized"
  | "review"
  | "stable"
  | "deprecated"
```

Do not allow low-quality content to silently enter high-trust exam
generation.

------------------------------------------------------------------------

# 95. Exam Eligibility

A question can have:

``` ts
interface QuestionEligibility {
  searchable: boolean
  practiceEligible: boolean
  examEligible: boolean
}
```

Example:

``` text
AI confidence = 0.42
→ searchable = yes
→ practiceEligible = maybe
→ examEligible = no
```

This is important.

------------------------------------------------------------------------

# 96. Reliability Hierarchy

Prefer:

``` text
human-reviewed canonical
        ↓
validated deterministic extraction
        ↓
high-confidence AI annotation
        ↓
low-confidence AI suggestion
```

Never treat them as equivalent.

------------------------------------------------------------------------

# 97. Deduplication

Exam corpora often contain duplicates.

Potential signals:

``` text
exact normalized statement
hash
fuzzy lexical similarity
same answer
same skill
same source pattern
```

Later:

``` text
embedding similarity
```

But embeddings are not required initially.

------------------------------------------------------------------------

# 98. Problem Identity

Do not assume:

``` text
one PDF question = one unique problem
```

The same mathematical problem can appear in:

-   multiple exams;
-   textbooks;
-   solution books;
-   websites.

Therefore:

``` text
Problem
   ↑
Question occurrence
   ↑
Source
```

is preferable.

------------------------------------------------------------------------

# 99. Source Occurrence

Potential model:

``` ts
interface ProblemOccurrence extends Entity {
  problemId: ID
  sourceDocumentId: ID

  pageStart: number
  pageEnd: number

  sourceQuestionNumber?: string

  originalText: string
}
```

This allows one canonical problem to have many source appearances.

------------------------------------------------------------------------

# 100. Exam Question Occurrence

Likewise:

``` text
Exam
  └── Question occurrence
       └── canonical Problem
```

This preserves historical information.

------------------------------------------------------------------------

# 101. Why This Matters

If Problem P123 appears in:

``` text
Exam 2022
Exam 2024
Practice book
```

the system learns:

``` text
same problem
different contexts
different source provenance
```

rather than storing three unrelated copies.

------------------------------------------------------------------------

# 102. Learning vs Content Truth

Keep these separate.

Content truth:

``` text
2 + 2 = 4
```

Learner belief:

``` text
Student thinks 2 + 2 = 5
```

Student state must never mutate canonical knowledge.

------------------------------------------------------------------------

# 103. AI Failure Containment

AI can hallucinate.

Therefore:

``` text
AI output
 ↓
schema validation
 ↓
source verification
 ↓
confidence
 ↓
review
```

For critical mathematical answers:

> Prefer extracting an answer from the source document over asking AI to
> invent one.

------------------------------------------------------------------------

# 104. Structured AI Output

Never request free-form output when the result is going into the
database.

Prefer JSON schemas such as:

``` json
{
  "skills": [
    {
      "skillCode": "algebra.inequality.am_gm",
      "confidence": 0.91
    }
  ],
  "approaches": [
    {
      "title": "AM-GM",
      "confidence": 0.88
    }
  ]
}
```

Then validate before persistence.

------------------------------------------------------------------------

# 105. AI Prompt Versioning

Every AI artifact should know:

``` text
task
prompt version
model
model version
input hash
output
timestamp
```

This allows reproducibility.

------------------------------------------------------------------------

# 106. AI Cache Key

Conceptually:

``` text
hash(
  task
  +
  normalized input
  +
  prompt version
  +
  model version
)
```

This prevents duplicate calls.

------------------------------------------------------------------------

# 107. Observability

Track:

``` text
PDFs processed
questions extracted
extraction failures
AI calls
AI tokens
AI cost
cache hit rate
review rate
question quality
student accuracy
session completion
```

A key metric:

> **AI calls avoided**

------------------------------------------------------------------------

# 108. Core Product Metrics

## Content

``` text
questions imported
questions stable
questions requiring review
duplicate rate
skill classification accuracy
```

## Learning

``` text
practice completion
mastery improvement
review success
hint usage
transfer success
```

## Exam

``` text
exam completion
difficulty calibration
skill coverage
historical similarity
experimental question performance
```

------------------------------------------------------------------------

# 109. Architecture Decision Records

Every major architectural decision should become an ADR.

Examples:

``` text
ADR-001 PostgreSQL-first
ADR-002 AI is enrichment, not core runtime
ADR-003 Stable canonical IDs
ADR-004 Repository versioning model
ADR-005 Scope as first-class domain
ADR-006 Problem vs Question separation
ADR-007 Embeddings as derived projections
```

This prevents architecture discussions from being forgotten.

------------------------------------------------------------------------

# 110. Open Questions

These should remain explicit instead of being prematurely decided.

### Data

-   How granular should a Skill be?
-   When should two Problems be considered the same?
-   How should cross-subject skills work?
-   How should source conflicts be represented?

### Learning

-   Which mastery algorithm should be used?
-   How should forgetting be estimated?
-   How should challenge difficulty expand?
-   How should method flexibility be measured?

### Exams

-   What exact historical decay function works best?
-   How many experimental questions are appropriate?
-   How should curriculum changes affect historical similarity?

### AI

-   Which tasks produce enough value to justify their cost?
-   Which models are sufficient for classification?
-   When should AI be retried?
-   How much human review is necessary?

------------------------------------------------------------------------

# 111. Suggested Initial Defaults

For MVP:

``` text
Database:
PostgreSQL

Runtime:
Bun.js

Language:
TypeScript

Search:
PostgreSQL FTS + structured filters

Vector:
optional / later

Graph:
relational edges

AI:
cached, budgeted, asynchronous

Content:
human-reviewable

Difficulty:
simple estimate → student calibration

Mastery:
simple skill-level model

Queue:
PostgreSQL-backed jobs initially

Storage:
object/file storage for PDFs
```

------------------------------------------------------------------------

# 112. Recommended Development Order

The most important dependency chain is:

``` text
PDF ingestion
    ↓
Canonical Problem/Question
    ↓
Provenance
    ↓
Skill + Scope
    ↓
Search
    ↓
Student State
    ↓
Adaptive Practice
    ↓
Exam Generation
    ↓
AI Enrichment
    ↓
Repository Contributions
    ↓
Advanced Learning
```

Do not reverse this order.

For example:

> Building a sophisticated RAG system before reliable canonical question
> extraction is a mistake.

------------------------------------------------------------------------

# 113. Minimal End-to-End Demo

The first meaningful demo should be:

``` text
Upload exam PDF
      ↓
System extracts 50 questions
      ↓
Human verifies 5–10
      ↓
Questions appear in repository
      ↓
Student chooses target scope
      ↓
Student solves 10 questions
      ↓
Skill mastery updates
      ↓
System recommends next 10
      ↓
Student takes generated mini-exam
      ↓
Experimental questions calibrate difficulty
```

If this works well, the core architecture is validated.

------------------------------------------------------------------------

# 114. Definition of MVP Success

The MVP is successful if:

### Content

-   large PDF batches can be imported;
-   questions are extracted reliably;
-   provenance is preserved;
-   humans can correct mistakes.

### Learning

-   the system tracks skill mastery;
-   recommendations are noticeably better than random selection;
-   scope is respected;
-   review is useful.

### Exams

-   generated exams respect blueprint constraints;
-   historical relevance is visible;
-   experimental questions can calibrate difficulty.

### Cost

-   AI is not required for every question;
-   repeated AI calls are cached;
-   ingestion works even if AI budget is exhausted.

------------------------------------------------------------------------

# 115. Long-Term Vision

The long-term system can become:

``` text
Open Learning Knowledge Network

Repositories
    ↓
Canonical knowledge
    ↓
Problems + solution graphs
    ↓
Learner models
    ↓
Adaptive learning
    ↓
Community contributions
    ↓
Better data
    ↓
Better calibration
    ↓
Better learning
```

The most valuable asset is not the AI model.

It is the **structured, versioned, provenance-rich learning corpus +
learner interaction data**.

------------------------------------------------------------------------

# 116. Final Architectural Principle

The entire project can be summarized as:

``` text
             SOURCE
               │
               ▼
          INGESTION
               │
               ▼
       CANONICAL CONTENT
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
   KNOWLEDGE  PROBLEM  EXAM
     GRAPH     GRAPH    GRAPH
       │       │        │
       └───────┼────────┘
               ▼
        LEARNING ENGINE
               │
               ▼
         STUDENT STATE
               │
               ▼
      ADAPTIVE EXPERIENCE
```

And the cost principle:

``` text
              AI
               │
       ┌───────┴────────┐
       │                 │
   ambiguity          enrichment
       │                 │
       └───────┬─────────┘
               ▼
          cached result

Everything else:
PostgreSQL + deterministic algorithms
```

> **Build the data and learning infrastructure first. Add AI where it
> creates leverage, not where it merely replaces ordinary software.**

------------------------------------------------------------------------

# Appendix A --- First Database Migration Checklist

``` text
[ ] users
[ ] repositories
[ ] repository_versions
[ ] source_documents
[ ] source_pages
[ ] source_blocks
[ ] scopes
[ ] skills
[ ] knowledge_nodes
[ ] knowledge_relations
[ ] problems
[ ] problem_skills
[ ] solution_approaches
[ ] solution_steps
[ ] questions
[ ] problem_occurrences
[ ] exams
[ ] exam_questions
[ ] students
[ ] skill_states
[ ] attempts
[ ] hints
[ ] annotations
[ ] ai_artifacts
[ ] provenance
[ ] issues
[ ] pull_requests
```

------------------------------------------------------------------------

# Appendix B --- First API Checklist

``` text
POST   /documents
POST   /documents/:id/process

GET    /problems
GET    /problems/:id
GET    /assessments/:id

GET    /skills
GET    /skills/:id

GET    /search

POST   /attempts
GET    /attempts/:id

GET    /students/:id/skills
GET    /students/:id/recommendations

POST   /sessions
GET    /sessions/:id

POST   /exams/generate
GET    /exams/:id

POST   /repositories
GET    /repositories/:id
POST   /repositories/:id/pulls
POST   /repositories/:id/issues
```

------------------------------------------------------------------------

# Appendix C --- First Worker Jobs

``` text
extract_document
normalize_document
segment_questions
normalize_problems
normalize_assessments
extract_answers
extract_assessment_items
deduplicate_problems
classify_skills
infer_prerequisites
generate_solution_approaches
generate_hints
recalculate_difficulty
```

------------------------------------------------------------------------

# Appendix D --- First AI Tasks

Only implement these initially:

``` text
1. skill classification
2. prerequisite suggestion
3. solution approach extraction
4. Polya hint generation
```

Everything else can wait.

------------------------------------------------------------------------

# Appendix E --- Team Discussion Template

For every architectural proposal:

``` md
## Proposal

### Problem
What problem are we solving?

### Proposed solution
What changes?

### Why?
Why is this better than the alternatives?

### Cost
What engineering / infrastructure / AI cost does it add?

### Complexity
What new concepts does the team need to maintain?

### Failure mode
What happens when this fails?

### Reversibility
Can we remove/change it later?

### MVP impact
Does this belong in MVP?

### Decision
- [ ] Accepted
- [ ] Rejected
- [ ] Deferred

### Notes
...
```

------------------------------------------------------------------------

# Appendix F --- Guiding Questions for Every Feature

Before adding a feature, ask:

1.  Can deterministic code solve this?
2.  Does it require AI?
3.  Can the result be cached?
4.  Does it belong in canonical data or derived data?
5.  Can we preserve provenance?
6.  Does it respect scope?
7.  Does it improve skill-level learning?
8.  Does it work across subjects?
9.  Can PostgreSQL handle it?
10. Is it necessary for MVP?
11. What happens when the feature is wrong?
12. Can a human correct it?
13. Can we measure whether it actually helps students?

If the answer to the last question is "no", the feature should probably
not be prioritized.

------------------------------------------------------------------------

# Appendix G --- One-Sentence Project Definition

> **A PostgreSQL-first, Bun.js-based, GitHub-like learning repository
> that transforms source documents and exam corpora into structured
> knowledge and reusable problems, then uses skill-based learner
> modeling and deterministic-first adaptive policies---with AI used
> selectively---to provide scoped, explainable, and cost-efficient
> learning experiences.**
