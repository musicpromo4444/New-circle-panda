# Circle Panda Chats

Build Circle Panda 🐼, an anonymous web social application with a virtual coin economy ("Panda Coins" or "BC").

​1. Navigation & UI Layout

​Header/Navbar:

​Circle Panda logo and name on the left (ensure buttons or header elements do not overlap or obscure the logo).

​User Panda Coin balance indicator (e.g., 100 BC).

​Clean navigation tabs: Anonymous Feed, Group Chats, Direct Messages, Events, and Dating.

​2. Anonymous Public Feed

​Post Creation: Users can publish anonymous text posts.

​Public Replies & Social Sharing: Every anonymous feed post must allow anyone to reply publicly in a comment thread. Include direct buttons on posts to share content outward to external social media platforms.

​3. Anonymous Group Chats (24-Hour Expiration)

​Ephemeral System: Group chats created by an admin are hidden/inactive until the admin clicks an "Open Group Chat" button.

​Notification & Timer: Clicking "Open Group Chat" sends an instant notification trigger to all group members and starts a strict 24-hour expiration countdown timer.

​Auto-Expiry: Once the 24-hour timer reaches zero, the group chat locks/expires completely.

​4. Direct Messages & Dating Chats

​Standard Direct Messaging:

​Normal direct chats do not have an expiration timer.

​Pay-per-message economy: Deduct exactly 1 BC from the sender's balance for every text message sent.

​Dating Chats:

​Direct messages initiated via the Dating tab must feature a prominent, styled "DATING CHAT" tag/badge on top of the chat interface.

​5. Events Module

​Event Cards: Display upcoming community events as visual cards on the Events tab.

​Full View Modal: Clicking any event card opens a detailed full-screen view/modal displaying event specifics, timing, and an RSVP action.

​Design & Styling

​Modern, mobile-first responsive dark theme with playful panda branding accents.

​Smooth toast notifications when coins are spent or timers are triggered.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://panda-coins-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/54a9497b-2ec8-49b0-a269-c96ca711a394).

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
