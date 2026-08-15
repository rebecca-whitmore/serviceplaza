# Service Plaza MVP: Supabase schema and security plan

Status: **Approved for implementation — no database has been created**  
Last reviewed: 15 August 2026

This document translates the agreed MVP product model into a proposed Supabase
database, authentication, storage and access-control design. Names may be refined
when the first SQL migration is written.

## 1. Recommended implementation approach

- Use Supabase Postgres as the source of truth for businesses, drafts, listing
  versions, categories and reviews.
- Use Supabase Auth passwordless magic links for both BUs and administrators.
- Enable row-level security (RLS) on every application table exposed through the
  Supabase API.
- Keep every submitted version as a historical snapshot. Editing creates a new
  draft; it never alters a submitted or published snapshot.
- Keep draft images private and publish only an approved copy.
- Track every schema change as a SQL migration committed to Git.
- Perform sensitive workflow transitions through server-side functions/actions,
  not by trusting values sent from the browser.

## 2. Entity relationship overview

```text
auth.users
    │
    ├── profiles
    │
    └── businesses ── listings ── listing_versions
                              │          ├── listing_category_assignments
                              │          ├── listing_service_tags
                              │          ├── listing_services
                              │          ├── listing_images
                              │          └── review_events
                              │
                              └── current published version

categories ── service_tags
```

The stable `listings` row supplies the permanent public URL. Its
`current_published_version_id` points to the exact approved snapshot that public
visitors can see.

## 3. Proposed database types

Postgres enum types keep workflow values explicit:

### `user_role`

- `business_user`
- `admin`

### `submission_status`

- `draft`
- `pending`
- `changes_requested`
- `approved`
- `declined`
- `withdrawn`

### `publication_status`

- `unpublished`
- `published`
- `hidden`
- `archived`

The four delivery and coverage choices are best represented by booleans rather
than arrays or overlapping labels:

- `offers_online`
- `offers_in_person`
- `serves_local`
- `serves_uk_wide`

At least one delivery value and one coverage value must be true before
submission.

## 4. Proposed tables

All primary keys use UUIDs. All mutable records have timezone-aware `created_at`
and `updated_at` values. User-facing timestamps are displayed in UK local time,
while the database stores them consistently.

### `profiles`

One private application profile per Supabase Auth user.

| Column | Purpose |
| --- | --- |
| `id` | Primary key and foreign key to `auth.users.id`. |
| `role` | `business_user` by default; only a protected administrator operation can assign `admin`. |
| `full_name` | Account holder’s private name. |
| `created_at`, `updated_at` | Audit timestamps. |

The BU cannot change their own role. The initial administrator role is assigned
manually and verified during setup.

### `businesses`

The private, stable business/account record.

| Column | Purpose |
| --- | --- |
| `id` | Business identifier. |
| `owner_user_id` | Owning BU; foreign key to `auth.users.id`. |
| `contact_name` | Private administrative contact. |
| `contact_email` | Private operational email; normally matches the Auth email initially. |
| `contact_phone` | Optional private operational telephone number. |
| `created_at`, `updated_at` | Audit timestamps. |

For the MVP, one user owns one business and one business has one listing. Unique
constraints should enforce this while leaving room to revisit multi-user teams
later.

### `listings`

The stable identity and public routing record.

| Column | Purpose |
| --- | --- |
| `id` | Listing identifier. |
| `business_id` | Unique foreign key to `businesses.id`. |
| `slug` | Unique, URL-safe public identifier. It should not change automatically when the business name changes. |
| `publication_status` | Defaults to `unpublished`. |
| `current_published_version_id` | Nullable reference to the approved version currently shown publicly. |
| `published_at` | First publication timestamp. |
| `created_at`, `updated_at` | Audit timestamps. |

A database constraint must prevent `published` status unless a current approved
version exists. Approval should set the pointer and publication status in one
transaction.

### `listing_versions`

A draft or immutable submitted snapshot of listing content.

| Column group | Proposed columns |
| --- | --- |
| Identity | `id`, `listing_id`, `version_number`, `created_by_user_id` |
| Workflow | `status`, `submitted_at`, `decided_at`, `supersedes_version_id` |
| Business copy | `business_name`, `short_summary`, `full_description` |
| Public contact | `public_contact_name`, `public_email`, `show_public_email`, `public_phone`, `show_public_phone` |
| Delivery | `offers_online`, `offers_in_person`, `serves_local`, `serves_uk_wide` |
| Location | `base_town_city`, `uk_region` |
| Links | `website_url`, `social_links` (validated JSON object of supported platform URLs) |
| Plaza Perk | `has_plaza_perk`, `perk_title`, `perk_description`, `perk_redemption`, `perk_conditions`, `perk_expires_on` |
| Category request | `category_help_requested`, `category_help_text` |
| Declaration | `declaration_accepted_at`, `terms_version`, `privacy_version` |
| Audit | `created_at`, `updated_at` |

Important database checks include:

- Short summary is no longer than 160 characters.
- Full description is 100–2,000 characters before submission.
- Public email/telephone cannot be exposed unless the matching consent flag is
  true.
- Base town/city and UK region are required for local or in-person services.
- Perk detail fields are required only when `has_plaza_perk` is true and remain
  null when it is false.
- Category-help text is required when `category_help_requested` is true.
- A submitted version has a declaration timestamp and recorded terms/privacy
  versions.
- `(listing_id, version_number)` is unique.

Only `draft` rows are editable. Submitting freezes that row as `pending`. A
change request or edit starts a new `draft` linked through
`supersedes_version_id`; this preserves exactly what the administrator reviewed.

### `categories`

Administrator-managed top-level browsing categories.

| Column | Purpose |
| --- | --- |
| `id` | Category identifier. |
| `name` | Public label. |
| `slug` | Unique URL/filter value. |
| `description` | Visitor/BU guidance and examples. |
| `is_active` | Hides a category from new selection without deleting history. |
| `sort_order` | Administrator-controlled display order. |
| `created_at`, `updated_at` | Audit timestamps. |

Category values are database rows, not TypeScript enums. Rebecca can add,
rename, reorder or retire them without deploying the application.

### `service_tags`

Administrator-managed specific services, functioning as the subcategory layer.

| Column | Purpose |
| --- | --- |
| `id` | Tag identifier. |
| `category_id` | Parent top-level category. |
| `name`, `slug` | Public label and stable filter value. |
| `is_active`, `sort_order` | Availability and display order. |
| `created_at`, `updated_at` | Audit timestamps. |

### `listing_category_assignments`

Joins a listing version to its selected top-level categories.

| Column | Purpose |
| --- | --- |
| `listing_version_id`, `category_id` | Composite unique assignment. |
| `is_primary` | Exactly one assignment per submittable version must be primary. |
| `created_at` | Audit timestamp. |

Submission validation and a database trigger enforce one primary category and a
maximum of three category assignments in total.

### `listing_service_tags`

Joins a listing version to its selected administrator-managed service tags. A
unique pair prevents duplicates. Each chosen tag should normally belong to one
of the version’s selected categories.

### `listing_services`

Stores BU-written service names for details that do not yet exist as reusable
tags.

| Column | Purpose |
| --- | --- |
| `id`, `listing_version_id` | Identity and owning version. |
| `name` | Plain-text service name. |
| `sort_order` | BU-controlled display order. |

Use a practical maximum of 15 services per version and 80 characters per name.
The administrator can later convert recurring wording into a reusable
`service_tags` record without changing the original snapshot.

### `listing_images`

Metadata for an optional uploaded logo/profile image.

| Column | Purpose |
| --- | --- |
| `id`, `listing_version_id` | Identity and owning version. |
| `private_storage_path` | Draft upload path in the private bucket. |
| `published_storage_path` | Nullable approved copy path in the public bucket. |
| `original_filename` | Private audit/display value; never used as the storage filename. |
| `mime_type`, `byte_size`, `width`, `height` | Validation metadata. |
| `display_publicly` | BU’s explicit choice. |
| `alt_text` | Public accessibility text when displayed. |
| `created_at` | Audit timestamp. |

The MVP permits one image per version. If no approved public image exists, the
app uses its built-in Service Plaza default image.

### `review_events`

Append-only workflow audit history.

| Column | Purpose |
| --- | --- |
| `id`, `listing_version_id` | Event identity and reviewed version. |
| `event_type` | Submitted, changes requested, resubmitted, approved, declined or withdrawn. |
| `performed_by_user_id` | Auth user responsible for the event. |
| `applicant_message` | Optional message safe to show to the BU. |
| `private_admin_note` | Optional administrator-only note. |
| `created_at` | Immutable event time. |

## 5. Authentication plan

### BU access

1. BU enters their email address.
2. Supabase sends a one-time magic link.
3. The callback exchanges the code for a secure cookie-based session.
4. On first sign-in, a private profile is created with the fixed
   `business_user` role.
5. The BU may access only their own business, drafts, submissions and images.

Allowed production and preview redirect URLs must be configured explicitly.
Whether a login attempt may create a new user should differ between the initial
“apply” flow and later “sign in” flow to avoid accidentally creating unwanted
accounts.

### Administrator access

The administrator uses the same passwordless mechanism but reaches protected
admin routes only when the database confirms the `admin` role. Knowing or
guessing an admin URL gives no access. Admin checks must occur on the server and
in RLS, not only in page navigation.

## 6. RLS access matrix

RLS is enabled on every table above. “Own” means the row is connected through
`businesses.owner_user_id = auth.uid()`.

| Resource | Public visitor | BU | Administrator |
| --- | --- | --- | --- |
| Active categories/tags | Read | Read | Create/read/update/retire |
| Published listings | Read | Read | Full access |
| Published current version | Read | Read | Full access |
| Non-public listing/version | No access | Own only | Full access |
| Draft content and assignments | No access | Create/read/update/delete own draft only | Full access |
| Submitted snapshots | No access | Read own; no direct edit/delete | Full access through review actions |
| Private business/contact data | No access | Own only | Full access |
| Review event BU message | No access | Read own | Full access |
| Private admin note | No access | No access | Full access |

Additional safeguards:

- Anonymous users receive no general insert/update/delete policies.
- BUs cannot set approval statuses, publication status, slugs, version numbers,
  administrator roles or published-version pointers directly.
- Public version access requires both `listings.publication_status = 'published'`
  and `listing_versions.id = listings.current_published_version_id`.
- Admin-role checks use protected database data or non-user-editable claims;
  never user-editable metadata.
- The service-role key is server-only and never uses a `NEXT_PUBLIC_` variable.
- Server actions still validate input; RLS is a second security boundary, not a
  replacement for validation.

## 7. Workflow operations

These multi-table transitions should execute atomically through carefully scoped
database functions or server-side transactions:

### Submit draft

- Verify ownership and `draft` status.
- Validate required fields, categories, tags, image and declaration.
- Change status to `pending`, set `submitted_at`, and append a review event.

### Request changes

- Administrator marks the reviewed version `changes_requested` and records the
  BU-facing request.
- The BU creates a new draft copied from that snapshot and linked through
  `supersedes_version_id`.

### Approve

- Verify the target remains `pending`.
- Mark it `approved`.
- Copy its approved public image to the published bucket when applicable.
- Set the listing’s current published version and status.
- Append the review event.
- Commit all database changes together; send email only after success.

### Decline or withdraw

- Update the submitted version to the terminal status.
- Append an appropriate review event.
- Queue the private application data for deletion/anonymisation after three
  months, subject to the final privacy policy.

## 8. Storage plan

Use two buckets:

### `listing-images-private`

- Private bucket for draft and review images.
- Path pattern: `{owner-user-id}/{listing-version-id}/{random-id}.{extension}`.
- BU may upload/read/delete only files they own and only while the related
  version is a draft.
- Administrator may read images for review.
- File names are generated; original names are metadata only.

### `listing-images-public`

- Contains only image copies approved for public display.
- Public read, but no public write/list management.
- Only trusted server-side approval/removal operations may copy or delete files.

Recommended initial restrictions: JPEG, PNG or WebP; maximum 5 MB; validate the
actual MIME type; reject SVG and executable formats. Exact resizing dimensions
can be decided with the listing-page design.

## 9. Retention and deletion

- Declined and withdrawn application content: delete or anonymise after three
  months.
- Abandoned drafts: propose deletion after six months of inactivity, preceded by
  a reminder email; confirm this period in the privacy policy.
- Approved versions: retain while the listing is active and as needed for a
  documented revision/audit purpose.
- Authentication accounts: do not automatically delete an account merely
  because one version was declined if the BU has another active record.
- Storage objects must be removed alongside the corresponding retained/deleted
  database content; deleting only the database row is insufficient.

The eventual cleanup job must be testable, logged and scoped to explicit dates
and statuses.

## 10. Migration and environment strategy

1. Create one hosted Supabase project in an appropriate UK/EU region after
   reviewing current region availability and data-processing terms.
2. Add the Supabase CLI as a project development dependency only when schema
   implementation begins.
3. Initialise a committed `supabase/` directory.
4. Write a reviewed initial migration containing types, tables, constraints,
   indexes, triggers and RLS policies.
5. Keep seed categories/service tags separate from production user data.
6. Preview migration changes before applying them remotely.
7. Generate TypeScript database types after each schema change.
8. Store local secrets in `.env.local` and production secrets in Vercel
   environment variables; neither is committed.

For this early project, using the hosted development database plus committed
migrations is simpler than requiring a local Docker stack immediately. A local
Supabase stack can be added when automated integration testing warrants it.

## 11. Tests required before application features use the schema

- Anonymous users can read only the current version of published listings.
- Anonymous users cannot enumerate drafts, private contacts or private images.
- A BU can access their own draft but not another BU’s data by guessed UUID.
- A BU cannot promote themselves to administrator.
- A BU cannot approve, publish or alter a submitted version.
- Category count and single-primary-category constraints reject invalid data.
- Public contact fields never appear without their explicit display flags.
- Requesting changes leaves the currently published version untouched.
- Approval updates status and published pointer together or not at all.
- Private uploads reject invalid types/oversized files and cannot be listed by
  another BU.
- Three-month retention selects only eligible declined/withdrawn records.

## 12. Confirmed implementation decisions

1. Use email **magic links** rather than numeric email codes for MVP sign-in.
2. One authenticated BU account owns one business/listing in the MVP.
3. Allow a maximum of 15 BU-written services, each up to 80 characters.
4. Use a 5 MB maximum for JPEG, PNG and WebP uploads; resizing dimensions remain
   a design decision.
5. Use six months as the abandoned-draft retention period, with a reminder
   before deletion.
6. Manage categories and service tags through the Supabase dashboard initially;
   build an admin taxonomy screen later when repeated edits justify it.

## 13. Next action after approval

Rebecca creates the empty Supabase project using the agreed settings. We then
add the Supabase CLI and client packages for their immediate purposes, create
the initial migration, test its constraints/RLS policies, and only then connect
the Next.js application.
