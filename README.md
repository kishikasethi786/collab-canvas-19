# Together Write

Build a complete, production-style full-stack web application called "CollabNote" — a real-time collaborative online notepad.

IMPORTANT:

This must be a FUNCTIONAL working application, not just a visual prototype. Every major button and feature should work. Use a real backend/database and real-time synchronization. Do not use fake/mock data for the main functionality.

TECH STACK:

- React + Vite for frontend

- Supabase for backend

- Supabase PostgreSQL database

- Supabase Authentication

- Supabase Realtime for live collaboration

- Modern CSS/Tailwind styling

- Use clean reusable React components

==================================================

1. LANDING PAGE

==================================================

Create a beautiful modern dark-mode landing page.

Brand:

CollabNote

Tagline:

"Write together. Think together."

Hero section:

- Large heading: "Your ideas, together in real time."

- Short description explaining that users can create, edit and share notes with their team.

- Primary button: "Start Writing"

- Secondary button: "Explore Features"

- Add an attractive visual preview of the collaborative editor.

Features section:

- Real-time collaboration

- Automatic saving

- Easy document sharing

- Secure authentication

- Multiple documents

- Online user presence

Use a premium SaaS-style design.

==================================================

2. AUTHENTICATION

==================================================

Create:

- Sign Up page

- Login page

- Logout functionality

- Password authentication using Supabase Auth

- User profile

After login, redirect the user to the dashboard.

Display the user's name/profile in the dashboard.

==================================================

3. DASHBOARD

==================================================

Create a professional dashboard.

Sidebar:

- CollabNote logo

- Dashboard

- My Documents

- Shared With Me

- Settings

- Logout

Main dashboard:

- "Good morning, [user name]"

- "Your Documents"

- Search bar

- "New Document" button

Document cards should show:

- Document title

- Last edited time

- Owner

- Number of collaborators

- More options menu

Allow:

- Create document

- Open document

- Rename document

- Delete document

- Search documents

==================================================

4. DOCUMENT EDITOR

==================================================

Create the main collaborative editor.

Layout:

------------------------------------------------

Top navigation

------------------------------------------------

CollabNote | Document Name | Users | Share

------------------------------------------------

Editor toolbar:

- Bold

- Italic

- Underline

- Strikethrough

- Heading

- Bullet list

- Numbered list

- Alignment

- Undo

- Redo

Main editor:

Large clean writing area.

The editor should feel similar to a simplified combination of:

- Google Docs

- Notion

- Microsoft Word

Do NOT copy their branding or exact design.

Document title should be editable.

Show:

"Saved"

or

"Saving..."

automatically.

==================================================

5. REAL-TIME COLLABORATION

==================================================

This is the MOST IMPORTANT feature.

Multiple users must be able to open the same document and edit it.

Use Supabase Realtime.

When User A changes the document:

- User B should see the changes without refreshing.

- User C should also receive the changes.

Display active collaborators at the top.

Example:

● K

● A

● R

3 people editing

Use colored circular avatars with initials.

Show a small presence indicator:

"3 people online"

When a user leaves, update the presence automatically.

Do not simulate this with fake data.

==================================================

6. SHARING

==================================================

Add a prominent "Share" button.

When clicked, open a sharing modal.

Modal should contain:

"Share this document"

Options:

- Copy document link

- Enter email/user

- Permission: Editor

- Permission: Viewer

Implement document permissions in the database.

Owner:

- Can edit

- Can delete

- Can manage collaborators

Editor:

- Can edit

- Cannot delete the document

Viewer:

- Can read

- Cannot edit

Copy Link button should actually copy the URL to the clipboard.

Show a toast:

"Link copied!"

==================================================

7. DATABASE

==================================================

Create proper Supabase database tables.

Users/Profile:

- id

- name

- email

- avatar

- created_at

Documents:

- id

- title

- content

- owner_id

- created_at

- updated_at

Document Collaborators:

- id

- document_id

- user_id

- permission

- created_at

Implement proper relationships.

Enable Row Level Security.

Users should only access documents they own or have permission to access.

==================================================

8. AUTO SAVE

==================================================

Automatically save document changes.

When the user stops typing:

- Save changes to Supabase

- Update updated_at

Display:

"Saving..."

then

"Saved just now"

Do not require the user to press a Save button.

==================================================

9. SEARCH

==================================================

Dashboard search should search:

- Document titles

- Document content

Search results should update smoothly.

Show:

"No documents found"

when there are no matches.

==================================================

10. SETTINGS

==================================================

Create a settings page.

Include:

Profile

- Name

- Email

- Avatar

Appearance:

- Dark mode

- Light mode

Account:

- Logout

Keep dark mode as the default.

==================================================

11. DESIGN

==================================================

Make the design visually impressive.

Theme:

Dark modern SaaS

Background:

Use deep charcoal/navy colors instead of pure black.

Suggested style:

- #090B10

- #11151D

- #171C26

Accent:

Purple → Blue gradient.

Use:

- Glassmorphism

- Soft borders

- Rounded corners

- Subtle shadows

- Smooth hover animations

- Smooth page transitions

Typography should be modern and highly readable.

The UI should look like a professional startup product.

Avoid:

- Generic Bootstrap appearance

- Huge unnecessary gradients

- Excessive animations

- Clutter

- Bright white backgrounds

==================================================

12. RESPONSIVE DESIGN

==================================================

The website must work on:

- Desktop

- Laptop

- Tablet

- Mobile

On mobile:

- Convert sidebar into a hamburger menu

- Editor should use the full screen

- Toolbar should become horizontally scrollable

- Sharing modal should fit the screen

==================================================

13. ERROR HANDLING

==================================================

Add proper loading states.

Examples:

"Loading documents..."

"Saving..."

"Something went wrong."

"Document not found."

"You're offline."

Add toast notifications for:

- Document created

- Document deleted

- Document renamed

- Document saved

- Link copied

- Collaborator added

- Errors

==================================================

14. EMPTY STATES

==================================================

If the user has no documents, show:

"No documents yet"

"Create your first document and start collaborating."

Button:

"+ Create Document"

==================================================

15. SECURITY

==================================================

Use Supabase authentication.

Implement Row Level Security.

Users must NOT be able to access documents they don't own or haven't been given permission to access.

Never expose secret keys in frontend code.

Use environment variables for configuration.

==================================================

16. URL ROUTING

==================================================

Create routes:

/

 /login

 /signup

 /dashboard

 /document/:id

 /settings

When someone opens:

/document/ABC123

load the corresponding document.

If they have permission, open the editor.

If they don't have permission:

show:

"You don't have permission to access this document."

==================================================

17. FINAL REQUIREMENTS

==================================================

Before considering the project complete:

1. Make sure the application starts without errors.

2. Make sure signup works.

3. Make sure login works.

4. Make sure creating documents works.

5. Make sure editing works.

6. Make sure auto-save works.

7. Make sure documents remain after refreshing.

8. Make sure sharing works.

9. Make sure document permissions work.

10. Make sure real-time collaboration works between two browser windows.

11. Make sure online user presence works.

12. Make sure deleting and renaming work.

13. Make sure mobile layout works.

14. Remove all placeholder/mock functionality.

15. Fix console errors.

16. Make the application visually polished.

IMPORTANT:

Do not stop after generating the UI.

Actually implement the database, authentication, CRUD operations, sharing permissions, and Supabase Realtime functionality.

If a Supabase configuration is required, clearly tell me exactly what I need to connect, but build everything else completely.

The final result should feel like a real collaborative productivity application that I can demonstrate as a college project.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://collab-canvas-19.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/beae751f-13a1-482a-9723-796d78103545).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
