# Service Plaza MVP: data and approval workflow proposal

Status: **Agreed direction; ready for schema planning**  
Last reviewed: 15 August 2026

This document proposes what Service Plaza should collect, publish and retain in
stage one. It is a product decision document, not a database specification or a
commitment to implement every item exactly as written.

## 1. Guiding principles

- Keep the application understandable for people who are not confident with
  technology.
- Collect only information that has a clear operational or public purpose.
- Never publish private application or account information accidentally.
- Require enough detail to make every published listing useful and trustworthy.
- Keep the currently approved version live while later edits are reviewed.
- Treat approval as an explicit administrator action with a basic audit trail.
- Avoid presenting approval as a guarantee, accreditation or endorsement unless
  Service Plaza later introduces a documented verification process.

## 2. Proposed application and listing fields

“Required” means required before an application can be submitted. Public fields
appear on an approved listing. Private fields are visible only to the applicant
and administrator.

| Field | Required? | Public? | Recommendation |
| --- | --- | --- | --- |
| Business name | Yes | Yes | Display name of the business. |
| Business owner/contact name | Yes | No by default | Used for administration; allow a separate public contact name if needed. |
| Applicant email address | Yes | No | Used for application updates and future account access. |
| Public contact email | No | Only when supplied | Keep separate from the applicant email to prevent accidental disclosure. |
| Public telephone number | No | Only when supplied | Do not require businesses to publish a personal number. |
| Logo or profile image | No | By explicit choice | Use the standard Service Plaza image when none is supplied or the BU does not want their image displayed. Define file restrictions before upload is built. |
| Short summary | Yes | Yes | Maximum: 160 characters. |
| Full business description | Yes | Yes | Recommended range: 100–2,000 characters. |
| Primary service category | Yes | Yes | Select one top-level primary category. |
| Additional categories | No | Yes | Select up to two additional top-level categories. |
| Subcategory/service tags | Yes | Yes | BU selects several existing tags and can add their own service wording when the right option is unavailable. |
| Delivery method | Yes | Yes | Online, in person, or both. |
| Service coverage | Yes | Yes | Local, UK-wide, or both. |
| Base town/city | Conditional | Yes | Required when local or in-person work is offered. |
| UK nation/region | Conditional | Yes | Required when local or in-person work is offered. |
| Areas served | No for MVP | No | Omit initially; base location plus delivery method and coverage provide enough information. Revisit if local search needs greater precision. |
| Website | No | Yes | Validate as an HTTPS/HTTP URL. |
| Social links | No | Yes | Use named platform links rather than one free-form text field. |
| Plaza Perk title | Conditional | Yes | Required only when the BU chooses to offer a perk. |
| Plaza Perk description | Conditional | Yes | Required only for a perk; explain what is included and how it helps. |
| Perk redemption instruction | Conditional | Yes | Required only for a perk; code, link or instruction needed to claim it. |
| Perk conditions | No | Yes | Required only when restrictions apply. |
| Perk expiry date | No | Yes | Leave blank for an ongoing perk. |
| Applicant declaration | Yes | No | Confirms accuracy, authority to submit and acceptance of listing terms/privacy notice. |
| Internal administrator notes | No | No | Never included in public listing data or applicant emails by default. |

### Plaza Perk rule

Plaza Perks are optional but recommended. The application should explain that a
perk helps a listing stand out and gives visitors an additional reason to make
contact. Examples should include a consultation, bonus service, resource or
introductory discount, while making clear that a perk need not have a monetary
value. Choosing not to offer one must not prevent submission.

### Public contact recommendation

Do not publish the applicant email or telephone number automatically. Ask for a
separate explicit confirmation for each contact method the BU wants displayed.
A website or social link may be sufficient.

### Delivery method and coverage

Keep these as two separate questions:

- **How are services delivered?** Online, in person, or both.
- **Where are customers served?** Local, UK-wide, or both.

“Online” describes how a service is delivered, while “UK-wide” describes who
can access it. Keeping both avoids ambiguity. Base town/city and region are
required for local or in-person businesses. A separate areas-served field is
not needed in the MVP.

## 3. Initial service categories

Categories must be stored as administrator-managed database records, not fixed
in application code. Rebecca can therefore add, rename, reorder or hide a
category without a code change or redeployment. An admin category-management
screen can be added when needed; initially this can be managed securely in
Supabase.

The agreed starting top-level categories are:

| Top-level category | Examples (guidance, not an exhaustive list) |
| --- | --- |
| Business & Administrative Support | Virtual assistants, operations, project management and bookkeeping support. |
| Marketing, Sales & PR | Social media, SEO, advertising, lead generation and public relations. |
| Web, Tech & Digital Services | Web designers, developers, automation specialists, tech VAs and cybersecurity. |
| Design, Content & Photography | Graphic design, branding, copywriting, photography, video and illustration. |
| Coaching, Consulting & Careers | Business coaches, life coaches, consultants, mentors and career specialists. |
| Education & Tutoring | Tutors, language teachers, music teachers, course providers and trainers. |
| Health, Therapy & Wellbeing | Counsellors, hypnotherapists, nutritionists, fitness professionals and holistic practitioners. |
| Beauty & Aesthetics | Beauty therapists, makeup artists, injectors, skincare and hair professionals. |
| Travel & Experiences | Travel consultants, itinerary planners, tour providers and retreat organisers. |
| Events & Celebrations | Wedding professionals, event planners, celebrants, entertainers and venue services. |
| Finance, Legal & Professional Services | Accountants, financial advisers, insurance specialists, HR and legal professionals. |
| Personal, Family & Lifestyle Services | Personal stylists, organisers, parenting support, pet services and other personal assistance. |

Each top-level category can have administrator-managed subcategories that
identify the actual service. For example, Marketing, Sales & PR could contain
Social Media Management, Email Marketing, SEO, Paid Advertising and PR.

A business selects one primary top-level category, up to two additional
top-level categories, and several specific service tags. This supports a
multi-disciplinary business without placing it indiscriminately in every
category.

Do not expose “Other” as a public category. The application instead offers
**I can’t find the right category** and asks the BU to describe their service.
Rebecca can assign an existing category or use repeated requests as evidence
that a new category or subcategory is needed.

## 4. Separate review and publication statuses

Application review and public visibility should not share one status field.
They answer different questions and separating them prevents accidental
publication.

### Submission/revision status

| Status | Meaning |
| --- | --- |
| `draft` | Saved by the BU but not yet submitted for review. |
| `pending` | Submitted and awaiting administrator review. |
| `changes_requested` | Administrator has asked the applicant for specific changes. |
| `approved` | This exact version was approved. |
| `declined` | This version will not be published. |
| `withdrawn` | Applicant or administrator ended the submission before approval. |

The preview is a step within a saved `draft`. Final submission changes it to
`pending`; draft content is never visible to the public or review queue.

### Listing publication status

| Status | Meaning |
| --- | --- |
| `unpublished` | No approved version is publicly visible yet. |
| `published` | The current approved version is publicly visible. |
| `hidden` | Temporarily removed from public view without deleting its history. |
| `archived` | No longer active and not publicly visible. |

Stage one needs `unpublished` and `published`. Defining the other values now is
low-cost, but their management controls should wait until they are required.

## 5. Proposed approval workflow

1. The BU signs in with a secure email link and creates or resumes a `draft`.
2. Progress can be saved between sessions, and the BU sees a preview before
   submission.
3. On final submission, the server validates all fields, validates the
   Turnstile token, stores the image safely and creates a `pending` version.
4. The BU receives a submission confirmation with a reference number.
5. The administrator reviews the submitted version in the private admin area.
6. The administrator chooses one of three actions:
   - **Approve:** make this exact version the listing’s published version.
   - **Request changes:** record clear requested changes and email the applicant.
   - **Decline:** record a private reason and email an appropriate applicant-facing
     explanation.
7. Approval and publication happen together in one server-side database
   operation so a partially approved state cannot occur.
8. After successful publication, the BU receives the live listing link.

When changes are requested, the BU returns through their secure account and
creates a replacement `draft` pre-filled from the reviewed version. They edit
the requested fields and submit the replacement. After publication, the BU can
also propose listing edits through the same new-draft process. The listing
continues pointing to its previously approved version until the replacement is
approved. Declining a revision therefore does not affect the live listing.

### MVP business area boundary

The ability to sign in by secure email link, save and resume a draft, respond to
change requests, and propose edits to a published listing moves into the MVP.
This is a limited BU area, not the whole previously planned stage-two portal.
Pause, hide and removal requests can remain outside the MVP until explicitly
prioritised.

## 6. Conceptual data structure

The eventual database can remain small while supporting safe revisions:

### `businesses`

The stable identity of a business. Holds private administrative contact details
and the link to its authenticated business user. It is not queried directly by
public pages.

### `listings`

The stable public identity and URL of a listing. Holds its publication status
and a reference to the currently published version. It does not contain a
second editable copy of all listing content.

### `listing_versions`

An immutable snapshot of all submitted listing content, including Plaza Perk
content and its review status. A new application or edit creates a new version
rather than overwriting an approved version.

### `categories`

The administrator-controlled hierarchy of public top-level categories and
subcategories. New records can be added without changing application code.

### `listing_category_assignments`

Links each listing version to one primary and up to two additional top-level
categories. Database constraints and server validation enforce those limits.

### `service_tags`

Administrator-managed specific services used for browsing and filtering.
Submitted free-text service wording can be reviewed before it becomes a reusable
public tag.

### `listing_images`

Stores image metadata and the Supabase Storage path rather than image binary
data. It should record which submitted version owns the image.

### `review_events`

A minimal audit trail recording the submission, approval, decline or change
request, who performed it, when it occurred and any relevant private/applicant
message. This is preferable to relying only on the latest status.

## 7. Access boundaries

- Public visitors may read only listings marked `published` and only the version
  referenced as currently published.
- Authenticated BUs may create and update only their own drafts and resubmit only
  their own change-requested versions.
- Only the administrator may see all submissions, private contact data and
  review notes or perform review actions.
- Supabase service-role credentials must never be sent to the browser.
- Storage rules must prevent unapproved uploads from becoming enumerable public
  assets. Approved images can be copied/promoted or served using a deliberate
  public strategy chosen during storage design.
- BUs may access only their own business, drafts and submissions. Row-level
  security should enforce this even when application code contains a mistake.

## 8. Validation and content safeguards

Before implementation, define and enforce:

- Maximum lengths for every text field.
- Allowed URL schemes and supported social platforms.
- Image MIME types, file size, pixel dimensions and safe generated filenames.
- Server-side Turnstile validation before saving a submission.
- Normalisation of email addresses and URLs.
- Output escaping and safe rendering of descriptions as plain text rather than
  accepting arbitrary HTML.
- Rate limiting or another abuse response if Turnstile alone proves insufficient.
- Automatic or scheduled deletion/anonymisation of declined and withdrawn
  application data after three months, except for any minimal record that has a
  documented legal or fraud-prevention purpose.

Service Plaza will accept regulated services at launch but does not endorse or
accredit providers. Audience-facing content and listing terms must explain that
businesses are responsible for their own qualifications, permissions and claims,
and that visitors should make appropriate checks. Any evidence collected later
must have a defined verification and retention purpose.

## 9. Agreed product decisions

1. Plaza Perks are optional but should be positively explained and recommended.
2. A BU selects one primary category, up to two additional categories and
   several service tags.
3. Categories and subcategories are administrator-managed data and can be added
   without a deployment.
4. An uploaded logo/profile image is optional. The Service Plaza default image
   is used when necessary, and an uploaded image is public only with the BU’s
   explicit choice.
5. Public email and telephone details require separate explicit confirmation.
6. Short summaries have a 160-character maximum. Full descriptions are 100 to
   2,000 characters; helper text should encourage useful, readable copy rather
   than filling the limit.
7. Regulated services are accepted, with clear audience-facing wording that
   Service Plaza publication is not endorsement or accreditation.
8. Declined and withdrawn applications are retained for three months, subject to
   final privacy-policy and lawful-retention review.
9. Limited passwordless BU access, saved drafts, change-request responses and
   proposed edits to published listings are part of the MVP.

## 10. Recommended next implementation step after approval

Once the decisions above are settled, translate this proposal into a reviewed
Supabase schema and row-level-security plan **on paper first**. Only after that
review should a Supabase project be connected or database migrations be added.
