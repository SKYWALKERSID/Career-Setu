# Academic taxonomy

CareerSetu stores stable taxonomy IDs alongside the legacy `course` and `branch` display fields so existing profiles remain readable while new values are normalized.

## Sources and scope

- Degree-level names follow the UGC degree nomenclature and the current UGC Minimum Standards of Instruction regulations page. UGC states that approved degree nomenclature must be followed and that a specific specialization may appear in parentheses; it does not provide one exhaustive list of every engineering branch.
- Engineering and technology programme names are based on the AICTE Approval Process Handbook 2024-2027, Annexure 12, where the technical programme category applies.
- Non-engineering branch and specialization options are an application-maintained, deliberately limited institutional taxonomy. They are not presented as an exhaustive national catalogue.

## Versioning

The current application version is `2025-UGC-2024-27-AICTE`. The taxonomy source metadata is stored on each option in `src/lib/academic/taxonomy.ts` and should be reviewed when UGC or AICTE nomenclature changes.

## Normalization rules

- Stable slugs are saved in `degree_id`, `branch_id`, and `specialization_id`.
- Legacy `course` and `branch` text is retained as a display/backward-compatibility projection.
- Existing display values are normalized by name, short name, and aliases when a profile is loaded.
- `Other / Not listed` uses the stable ID `other` and stores the user-entered value in the corresponding `*_other` column.
- Branch options depend on degree; specialization options depend on branch. Changing a parent clears its descendants.

Sources: UGC regulations, https://www.ugc.gov.in/regulations; AICTE Approval Process Handbook 2024-2027, https://aicte-qa.aicte-india.org/sites/default/files/APH%20Final.pdf.
