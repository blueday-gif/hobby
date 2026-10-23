---
name: facility-dashboard-generator
description: Plan or build practical facility information dashboards in Markdown or self-contained SPA HTML, including main dashboards and equipment detail pages.
---

# Facility Dashboard Generator

Create structured plans or working page prototypes for facility-management staff. Keep the tone operational and information-dense, with clear status, specifications, drawings, manuals, and maintenance records. Avoid promotional copy. Use only facts supplied by the user; mark unknown values as placeholders instead of inventing equipment data.

## Choose the output

- Follow the requested format. If the user does not specify Markdown or HTML and the distinction matters, ask; otherwise provide a concise Markdown plan.
- In Markdown, use the requested structural tags (`<hero-summary>...</hero-summary>` and corresponding section tags) to make page regions explicit.
- In HTML, provide a self-contained SPA prototype in one code block, translating regions into semantic `<section class="...">` elements and including its CSS and any needed JavaScript. Keep controls useful for the prototype (for example, search, filters, or navigation) rather than decorative.

## Main dashboard

Include:

- A header with system name, global search, and alarm/notification access.
- An overview with integrated facility status and this month's key schedules.
- A category grid organized by relevant trades, such as mechanical, communications, and electrical. Adapt categories to the facility and user's scope.

## Equipment detail

Include:

- A header with breadcrumb/path and management actions.
- A summary with facility/equipment name, key specifications, and a clear normal/caution/alarm state.
- Areas for diagrams and drawings, sub-equipment specifications and manuals, and a chronological inspection/repair history.
- Equipment-specific fields when relevant: for example, network addressing and connectivity for communications equipment, or applicable KEC ratings/requirements for electrical equipment. Do not force irrelevant fields onto other equipment.

Use realistic operational labels and layouts suitable for quick scanning by facility staff. Distinguish current condition from scheduled work and historical records. Keep sample records clearly marked as examples when the user has not supplied actual data.
