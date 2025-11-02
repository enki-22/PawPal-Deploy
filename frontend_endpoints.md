## **CHUNK 3 & 4: Admin Dashboard UI** 🔴 HIGH PRIORITY
```
Frontend Integration for Admin Dashboard:

MAIN SCREEN:
Location: src/screens/admin/DashboardScreen.jsx

Layout (Scrollable):

1. Header Section
- Welcome message: "Good morning, Dr. Hazel"
- Profile image (circular)
- Role badge (Master/Vet/Desk)
- Logout button (top right)

2. Stats Cards (Horizontal Scroll or Grid)
- Total Users
  * Icon: 👥
  * Count
  * Subtitle: "Registered clients"
- Total Pets
  * Icon: 🐾
  * Count
  * Subtitle: "Active pets"
- Total Reports
  * Icon: 📊
  * Count (with filter dropdown: Last 7 days/30 days/All time)
  * Subtitle: "SOAP reports"
- Total Conversations
  * Icon: 💬
  * Count (with filter dropdown: This week/This month/All time)
  * Subtitle: "Chatbot sessions"

API Integration:
GET /api/admin/dashboard/stats?report_filter=last_7_days&chat_filter=this_week

3. Recent Pets Section
- Title: "Recently Registered Pets"
- Horizontal scrollable cards showing:
  * Pet photo
  * Name
  * Species + Breed
  * Owner name
  * Registration date (e.g., "2 days ago")
- "View All" button → navigates to Pets screen

API Integration:
GET /api/admin/dashboard/recent-pets

4. Flagged Cases Section
- Title: "Flagged Cases"
- Filter tabs: All | Emergency | Urgent | Moderate
- List of flagged case cards:
  * Flag badge (color-coded)
  * Pet name + species
  * Condition (primary diagnosis)
  * Likelihood %
  * Owner name
  * Date flagged
  * Tap to view full SOAP report
- Show top 5, "View All" button

API Integration:
GET /api/admin/dashboard/flagged-cases?filter=all

5. Charts Section
A. Species Breakdown (Pie/Donut Chart)
- Title: "Pets by Species"
- Dogs, Cats, Birds, Rabbits, Others
- Interactive: tap segment to filter

B. Common Symptoms (Bar Chart)
- Title: "Top 10 Reported Symptoms"
- Horizontal bars with counts
- Scrollable if > 10 symptoms

C. Symptoms by Species (Grouped Bar Chart)
- Title: "Symptoms by Species"
- Toggle between species tabs

API Integration:
GET /api/admin/dashboard/charts

6. FAQs Section
- Title: "Frequently Asked Questions"
- Expandable accordion
- Questions + Answers
- "Add FAQ" button (Master/Vet only)

API Integration:
GET /api/admin/dashboard/faqs

7. Announcements Section
- Title: "Active Announcements"
- Cards showing:
  * Icon (based on type)
  * Title
  * Description (truncated)
  * Validity period
- "Manage Announcements" button

API Integration:
GET /api/admin/dashboard/announcements

COMPONENTS TO CREATE:

1. StatCard Component
Location: src/components/admin/StatCard.jsx
Props: { icon, count, subtitle, filterOptions, onFilterChange }
- Animated count-up effect
- Optional filter dropdown

2. FlaggedCaseCard Component
Location: src/components/admin/FlaggedCaseCard.jsx
Props: { caseData, onPress }
- Compact horizontal card
- Flag badge with severity color
- All relevant info visible

3. ChartContainer Component
Location: src/components/admin/ChartContainer.jsx
Props: { title, children }
- Consistent chart styling
- Loading state
- Error state

CHARTS LIBRARY:
Use: react-native-chart-kit or victory-native
- Pie/Donut chart for species
- Bar chart for symptoms
- Responsive sizing

NAVIGATION:
- Bottom tab: "Dashboard" (home icon)
- Can navigate to:
  * Reports screen (from flagged cases)
  * Pets screen (from recent pets)
  * Announcements screen (from announcements)
  * Clients screen (from stats)

REFRESH:
- Pull to refresh all dashboard data
- Show refresh indicator
- Update timestamp: "Last updated 2 mins ago"

PERMISSIONS:
- All sections visible to: Master, Vet, Desk
- Some actions restricted (editing, deleting)

RESPONSIVE DESIGN:
- Tablet: Multi-column layout
- Phone: Single column scroll
- Landscape: Adjusted chart sizes

ERROR HANDLING:
- Network error: Show retry button per section
- No data: Show empty state illustrations
- Session expired: Redirect to admin login

LOADING STATES:
- Skeleton loaders for each section
- Stagger loading (stats → recent pets → charts)
```

---

## **CHUNK 5: Admin Reports UI** 🔴 HIGH PRIORITY
```
Frontend Integration for Admin Reports Management:

MAIN SCREEN:
Location: src/screens/admin/ReportsScreen.jsx

Layout:

1. Header Section
- Title: "SOAP Reports"
- Search bar:
  * Placeholder: "Search by pet name, owner, case ID..."
  * Search icon
  * Clear button (when text present)
- Filter button (icon: ⚙️)

2. Filters Modal/Sheet
Trigger: Tap filter button
Filters available:
- Date Range:
  * Radio buttons: Today, Last 7 days, Last 30 days, Custom, All time
  * Custom: Date picker (from - to)
- Species:
  * Checkboxes: All, Dogs, Cats, Birds, Rabbits, Others
- Flag Level:
  * Checkboxes: All, Emergency, Urgent, Moderate
- Apply button
- Reset filters button

3. Reports List
- Active filters indicator: "Showing 45 reports (3 filters active)"
- Sort dropdown: Date (newest), Date (oldest), Flag severity
- Report cards showing:
  * Case ID
  * Pet name + species + breed
  * Owner name
  * Date generated (e.g., "June 4, 2025")
  * Flag badge (if flagged)
  * Tap to view details
- Infinite scroll / Load more
- Empty state: "No reports found" (with illustration)

API Integration:
GET /api/admin/reports?search=&dateRange=&species=&flagLevel=&page=1&limit=10
- Debounce search (500ms)
- Backend pagination
- Cache previous pages

4. Report Detail Screen
Location: src/screens/admin/ReportDetailScreen.jsx

Same layout as Pet Owner SOAP Detail Screen, but with additional:

Admin Actions Section:
- Edit Report (Master/Vet only) - future feature
- Download PDF
- Email to Owner
- Archive Report (Master/Vet only)
- Delete Report (Master only) - with confirmation

Contact Owner Quick Actions:
- Call owner: Deep link to phone
- Email owner: Deep link to email
- View owner profile: Navigate to client detail

Pet Quick Actions:
- View pet profile: Navigate to pet detail screen
- View pet's other diagnoses
- View pet's chat history

API Integration:
GET /api/admin/reports/:caseId

5. Flagged Reports Screen (Quick Access)
Location: src/screens/admin/FlaggedReportsScreen.jsx

Similar to main Reports screen but:
- Pre-filtered to flagged cases only
- Tabs: All | Emergency | Urgent | Moderate
- Count badges on tabs
- Sorted by severity then date
- Cannot remove flag filter

API Integration:
GET /api/admin/reports/flagged?filter=all

COMPONENTS TO CREATE:

1. ReportCard Component
Location: src/components/admin/ReportCard.jsx
Props: { report, onPress }
- Compact card design
- Flag badge (if applicable)
- All essential info visible
- Swipe actions (future: archive, delete)

2. FilterModal Component
Location: src/components/admin/FilterModal.jsx
Props: { visible, filters, onApply, onReset, onClose }
- Bottom sheet or modal
- Smooth animations
- Apply/Reset buttons at bottom

3. SearchBar Component (reusable)
Location: src/components/admin/SearchBar.jsx
Props: { value, onChangeText, onClear, placeholder }
- Debounced search
- Clear button
- Search icon

4. DateRangePicker Component
Location: src/components/admin/DateRangePicker.jsx
Props: { fromDate, toDate, onChange }
- Calendar picker (use date library)
- Validate: from < to
- Preset buttons: Today, Last 7 days, Last 30 days

NAVIGATION:
Bottom tab: "Reports" (📊 icon)

SEARCH IMPLEMENTATION:
- Debounce: 500ms after typing stops
- Show loading indicator in search bar
- Clear button visible when text present
- Search history (optional): show recent searches

PAGINATION:
- Initial load: 10 reports
- Infinite scroll: Load next 10 when near bottom
- Show "Loading more..." indicator
- Cache loaded pages

FILTERS PERSISTENCE:
- Remember applied filters during session
- Show count: "3 filters active"
- Clear all filters button

EMPTY STATES:
- No reports: Illustration + "No reports yet"
- No search results: "No reports match your search"
- No flagged cases: "No flagged cases at this time"

ERROR HANDLING:
- Network error: Retry button
- Invalid filters: Validation messages
- Session expired: Redirect to login

PERFORMANCE:
- Virtualized list (FlatList)
- Image lazy loading
- Pagination for large datasets

EXPORT FEATURES (Future):
- Export filtered reports as CSV
- Download multiple reports as ZIP