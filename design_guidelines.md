# Design Guidelines: Health Problem Registration & Monitoring System

## Design Approach: Enterprise Healthcare System
**Selected Framework:** Material Design with healthcare industry adaptations (inspired by Epic MyChart, athenahealth)
**Rationale:** Information-dense, form-heavy healthcare application requiring clarity, efficiency, and HIPAA-compliant professionalism.

## Core Design Principles
1. **Clinical Clarity:** Zero ambiguity in data presentation and form fields
2. **Efficient Workflows:** Minimize clicks, optimize for rapid data entry
3. **Hierarchical Information:** Clear visual distinction between patient data, health problems, and system management
4. **Trust Through Consistency:** Professional, stable interface that builds user confidence

## Typography System
- **Primary Font:** Inter (via Google Fonts CDN)
- **Hierarchy:**
  - Page Titles: text-2xl font-semibold
  - Section Headers: text-xl font-medium
  - Card/Module Titles: text-lg font-medium
  - Body Text: text-base font-normal
  - Form Labels: text-sm font-medium
  - Helper Text: text-sm text-gray-600

## Layout System
**Spacing Units:** Tailwind units of 2, 4, 6, and 8 (p-2, p-4, p-6, p-8, gap-4, etc.)
- Card padding: p-6
- Section spacing: space-y-6
- Form field gaps: gap-4
- Container max-width: max-w-7xl

**Grid Strategy:**
- Dashboard: 3-column stat cards (grid-cols-1 md:grid-cols-3)
- Form layouts: 2-column for desktop (grid-cols-1 md:grid-cols-2)
- Data tables: Full-width responsive tables
- Patient list: Single column cards on mobile, 2-column on tablet, list view on desktop

## Component Library

### Navigation
- **Sidebar Navigation:** Fixed left sidebar (w-64) with collapsible sections for Patient Management, Health Problems, Form Builder, User Management
- **Top Bar:** Contains user profile, notifications, search, and logout
- **Breadcrumbs:** Show current location hierarchy on all pages

### Dashboard Components
- **Stat Cards:** Recent patients, active health problems, pending forms (with icons from Heroicons)
- **Activity Feed:** Recent registrations and updates
- **Quick Actions:** Prominent CTAs for "Register New Patient" and "Add Health Problem"

### Form Components
- **Dynamic Form Builder Interface:**
  - Left panel: Question bank with drag-drop capability
  - Center: Form preview with real-time updates
  - Right panel: Question properties (type, options, validation)
- **Patient Registration Form:** 2-column layout with clear sections for Personal Data and Address
- **Health Problem Forms:** Accordion-style sections grouping related questions

### Data Display
- **Patient List:** Sortable table with search, filters (by health problem type, registration date)
- **Patient Detail View:** Tab interface (Overview, Health Problems, Documents, History)
- **Health Problem Cards:** Visual cards showing problem type, registration date, status badge

### User Management
- **Permissions Matrix:** Checkbox grid showing users vs. health problem types
- **Role Assignment:** Clear visual indicators for admin, data entry, view-only roles

## Page-Specific Layouts

### Dashboard (Landing)
- Hero stats row (3 cards)
- Two-column below: Recent Activity (left 2/3) + Quick Actions sidebar (right 1/3)

### Patient Registration
- Centered form (max-w-4xl) with progress indicator
- Sticky footer with Save/Cancel actions

### Form Builder
- Three-panel horizontal split (20% question bank, 50% preview, 30% properties)
- Toolbar with Add Question Type buttons

### Patient Detail
- Header with patient name, photo placeholder, key info
- Tabbed content area below
- Floating action button for "Add Health Problem"

## Interaction Patterns
- **Loading States:** Skeleton screens for data tables, spinner for form submissions
- **Validation:** Inline error messages below fields with red border treatment
- **Success Feedback:** Toast notifications (top-right) for successful actions
- **Modals:** For confirmations (delete, permission changes) - max-w-md centered

## Accessibility
- WCAG 2.1 AA compliance mandatory (healthcare context)
- Clear focus indicators on all interactive elements
- Semantic HTML throughout (proper heading hierarchy, form labels)
- Keyboard navigation for all workflows
- Screen reader-friendly data tables with proper ARIA labels

## Icons
Use Heroicons (via CDN) throughout:
- Navigation icons in sidebar
- Action icons in buttons
- Status indicators in tables
- Form field type icons in builder

## Images
**No hero images required** - this is a clinical application focused on data management, not marketing. Use icons and data visualizations instead.

**Charts/Visualizations:**
- Health problem trends (line charts)
- Patient distribution by problem type (donut chart)
- Use Chart.js library for data visualizations

This system prioritizes efficiency, clarity, and trustworthiness appropriate for healthcare data management.