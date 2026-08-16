# Service Plaza launch service taxonomy

Status: **Approved 16 August 2026**

The launch taxonomy contains the 12 approved top-level categories and eight
specific service tags beneath each category. The canonical tag names and slugs
are stored in migration `20260816104956_seed_initial_service_tags.sql`.

Selection rules:

- One primary top-level category.
- Up to two additional top-level categories.
- Up to eight service tags in total.
- Up to 15 BU-written services, each up to 80 characters.
- Tags shown to a BU come from their selected categories.
- Missing categories/services are submitted for administrator review and do not
  automatically become public taxonomy entries.
- Categories and tags can be added, reordered or retired as data without an
  application deployment.
