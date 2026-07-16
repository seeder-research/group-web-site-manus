# SEEDER Website TODO

## Phase 2: Global Layout & Assets
- [x] Upload SEEDER logos (Original.png, narrow1.png) to CDN
- [x] Configure global theme: white bg, navy blue/black headers, orange accents
- [x] Build top navigation bar with SEEDER logo and section links
- [x] Build footer with NUS/CDE/ECE links and contact info
- [x] Set up responsive layout and typography

## Phase 3: Database Schema & Backend API
- [x] Schema: team_members table (name, photo, bio, email, research_interests, category, is_alumni)
- [x] Schema: publications table (title, authors, date, journal, pages, doi, bibtex, year)
- [x] Schema: research_projects table (title, description, image, order)
- [x] Schema: news_posts table (title, date, timezone, description, image_url, link)
- [x] Schema: contact_messages table (name, email, subject, message)
- [x] Backend: CRUD procedures for team members
- [x] Backend: CRUD procedures for publications + CrossRef DOI lookup
- [x] Backend: CRUD procedures for research projects
- [x] Backend: CRUD procedures for news posts
- [x] Backend: Contact form submission handler
- [x] Run db:push to apply schema

## Phase 4: Frontend Pages
- [x] Home page: hero section, mission statement, recent news highlights
- [x] Research page: focus area description + dynamic project cards
- [x] Team page: 9-category directory + Alumni section
- [x] Publications page: searchable/filterable list
- [x] News/Events page: blog-style posts with date/time/timezone
- [x] Contact page: email, phone, address, NUS/CDE/ECE links, contact form

## Phase 5: Admin Forms & Content Management
- [x] Admin dashboard (protected, owner-only)
- [x] Add/edit/delete team member form (with photo upload, placeholder support)
- [x] Add/edit/delete publication form (BibTeX input OR DOI lookup via CrossRef)
- [x] Add/edit/delete research project form
- [x] Add/edit/delete news post form (with image upload, optional link)

## Phase 6: Tests & Delivery
- [x] Write vitest tests for all backend procedures (23 tests passing)
- [x] Write vitest tests for team member CRUD
- [x] Write vitest tests for publication CRUD (including BibTeX parser)
- [x] Save checkpoint
- [x] Deliver to user

## User Requested Changes
- [x] Fix white background on all pages (currently showing navy/dark hero background on non-home pages)
- [x] Add category filter to Team page (filter by Ph.D., Postdoctoral Fellow, Intern, etc.)
- [x] Research page: change 'SRAM' tag under Materials layer description to 'Spintronics'
- [x] Contact page: change 'NUS College of Design & Engineering' to 'NUS CDE' in affiliations
- [x] Publications schema: add url, relatedProjects, pubType fields; run db:push
- [x] Publications backend: update router to support filtering by project, type (journal/conference), year; add url and relatedProjects to create/update procedures
- [x] Publications page: rebuild with project/type/year filters, sort toggle (newest/oldest), year-separator dividers in results list
- [x] Admin publications form: add url, relatedProjects, pubType fields
- [x] Home page: change hero background from navy to white
- [x] Footer: change background from dark to white
- [x] Publications page: add checkbox selection system and multi-format export (IEEE, Nature, APS, RSC, APA, BibTeX)
- [x] Publications backend: add citation formatter endpoint for all 6 formats
- [x] Home page: update hero header to 'Scalable & Energy Efficient Devices & Electronics Research (SEEDER) Group'
- [x] Parse Publications.bib and bulk-import all entries into the publications database (123 entries, 2006-2026)
- [x] Publications: support all BibTeX entry classes (article, inproceedings, book, incollection, phdthesis, techreport, misc, etc.) with pubType mapped accordingly
- [x] Publications Admin: add bulk .bib file upload tab — user uploads a text file with one or more BibTeX entries, system parses and previews them before inserting
- [x] Publications Admin: add duplicate detection button — finds entries with matching titles or DOIs, shows them in a list with checkboxes so user can select and delete duplicates
- [x] Publications Admin: URL field clearly labeled 'Custom URL (overrides DOI link)' in the edit form
- [x] Publications page: ExternalLink icon on each card — active (navy hover) when URL or DOI exists, greyed out and non-clickable when neither is set; tooltip distinguishes DOI vs custom URL
- [x] ResearchProject page: image width changed from full-width to 360px (visual editor change)
- [x] Research Project: square hero image upload (thumbnail/banner above title on project card and detail page)
- [x] Research Project: multi-image gallery with lightbox and optional captions, interspersed with content
- [x] Research Project: Selected Publications section (up to 5 latest linked publications, compact numbered list) below the title
- [x] Create 'Ferroelectric Transistors' research project with hero image, 5 gallery images, description, and 4 topic tags
- [x] Research page: add '(ATCO)' abbreviation in intro paragraph; rename focus area heading to 'ATCO of Scalable Compute-In-Memory Systems: from Edge to Datacenter Scale'
- [x] Research page: project cards show hero image uncropped (object-contain instead of object-cover)
- [x] Research project detail page: remove hero image from header
- [x] Research page Design Stack: update Applications, Architecture, Circuits, Devices sub-labels
- [x] Research page: topic filter/search bar on project grid
- [x] Research page: card hover effect revealing brief summary
- [x] Site nav: Research hover dropdown with link to Research Projects section
- [x] Research page: fix Circuits typo 'digita/AMS' → 'digital/AMS'
- [x] Research page: remove 'Mixed-Signal Circuits' tag from Current Research Focus
- [x] Team page: hide member photos by default, reveal on card hover
- [x] Team page: remove photo placeholder from member cards
- [x] Team page: card hover reveals photo as overlay covering the full card
- [x] Team page: verify role/category filter is working
- [x] Team page: rectangular photo in hover overlay (not circular)
- [x] Team page: add search bar to find members by name or research interests
- [x] Team page: hover overlay photo fixed at 200x300px rectangle
- [x] Team page: hover overlay photo resized to 150x225px
- [x] Edit member profile: allow authorised users to edit and save member details (name, role, category, biography, email, photo) from the Team page
- [ ] Team members: add 'title' field to schema (Dr., Prof., Mr., Ms., etc.)
- [ ] Team members: ensure firstName, lastName, title, role, category, researchInterests, biography, photoUrl all present in schema and admin form
- [ ] Team page: display title in member card and hover overlay
- [x] Team member schema: add title, firstName, lastName, role fields; update admin form and Team page display; photo size 150x225
- [x] Admin TeamMemberForm: add JSON file upload to auto-populate fields + simultaneous photo upload
- [x] Admin TeamMemberForm: add Download JSON Template button in Quick Import strip
- [x] Team page: rename 'PhD Students' label to 'Ph.D. Students' for current members
- [x] Team page: merge Graduate Student (M.Sc.) and Graduate Student (M.Eng.) current members under 'Master Students' section
- [x] Database: title-case all last names in team_members table
- [x] Database: title-case all first names in team_members table
- [x] Database: update displayName (name field) for all members from corrected firstName + lastName
- [x] Team page: biography modal opens when user clicks a member card
- [x] Team members: add 'title' field to DB and set 'Asst. Prof.' for PI Xuanyao (Kelvin) Fong
- [x] Team page edit modal: implement photo upload so admin can update member photos
- [x] Team page: sort members within each category by last name ascending
- [x] Split alumni "Graduate Student" category into Graduate Student (Ph.D.), Graduate Student (M.Eng.), Graduate Student (M.Sc.) sub-categories
- [x] Apply user-corrected names and categories from uploaded CSVs (29 alumni graduate students updated)
- [x] Display last names in ALL-CAPS on Team page (card, bio modal, photo overlay)
- [x] Update MEMBER_CATEGORIES schema to include Graduate Student (Ph.D.) and Graduate Student (M.Sc.)
- [x] Update edit modal category selector to include all three alumni graduate student sub-categories
