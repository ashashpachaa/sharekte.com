# Social Media Platforms Management Guide

## Overview
The social media links management system is now fully enhanced with comprehensive platform support and an easy-to-use admin interface with platform quick selectors.

## Features Implemented

### 1. **Expanded Platform Icons** 
Added icons for 70+ social media platforms organized by category:

#### Social Networks
- Twitter (X) - 𝕏
- Facebook - f
- Instagram - 📷
- LinkedIn - in
- YouTube - ▶️
- TikTok - ♪
- Snapchat - 👻
- Pinterest - P
- Reddit - 🔥
- Threads - 📝
- Bluesky - 🌅
- Mastodon - 🐘
- BeReal - 🔵
- Nextdoor - 🏘️

#### Tech & Developer
- GitHub - 🐙
- GitLab - 🦊
- Dev.to - ⚡
- Medium - 📝
- Hashnode - #
- Stack Overflow - 🏗️
- Substack - 📧
- Blogspot - 📰

#### Chat & Messaging
- Discord - 💬
- Telegram - ✈️
- WhatsApp - 💬
- Signal - 🔐
- WeChat - 🐉
- Viber - 📱
- Slack - 💜
- Skype - 💙

#### Video & Streaming
- Twitch - 🎮
- Vimeo - ▶️
- Dailymotion - ▶️
- Rumble - 🎬
- Loom - 📹
- YouTube Live - ▶️
- Facebook Live - 📺

#### Creative Platforms
- Behance - 🎨
- Dribbble - 🎯
- ArtStation - 🖌️
- DeviantArt - 🎭

#### Professional Services
- Fiverr - 💼
- Upwork - 💼
- Freelancer - 💼

#### Business & Other
- Yelp - ⭐
- Google Business - 🔵
- Apple Maps - 🗺️
- OpenSea - 🌊
- PayPal - 🅿️
- Ko-fi - ☕
- Patreon - 🎁
- Stripe - 💳
- Buy Me A Coffee - ☕

#### Contact Methods
- Email - 📧
- Website - 🌐
- Phone - ☎️

### 2. **Enhanced Admin Interface**

#### Platform Selector Dropdown
- Dropdown menu with all 70+ platforms
- Platforms displayed with their icons
- Auto-fill icon when platform is selected
- Option to add custom platforms

#### Platforms Reference Section
- Visual grid showing all available platforms by category
- Quick-add buttons for each platform
- One-click platform selection

#### Categories Displayed
1. Social Networks
2. Video Platforms
3. Developer & Tech
4. Messaging
5. Contact Methods

### 3. **API Endpoints**

#### Get Available Platforms
```bash
GET /api/social-media/platforms/available
```
Response:
```json
{
  "platforms": [
    { "name": "Twitter (X)", "icon": "𝕏" },
    { "name": "Facebook", "icon": "f" },
    ...
  ]
}
```

#### Get All Social Media Links
```bash
GET /api/social-media
```

#### Create Social Media Link
```bash
POST /api/social-media
Body: {
  "platform": "Instagram",
  "icon": "📷",
  "url": "https://instagram.com/yourhandle",
  "displayText": "Follow on Instagram",
  "isActive": true
}
```

#### Update Social Media Link
```bash
PATCH /api/social-media/:id
Body: { ...updates }
```

#### Delete Social Media Link
```bash
DELETE /api/social-media/:id
```

#### Reorder Social Media Links
```bash
POST /api/social-media/reorder
Body: { "links": [...] }
```

### 4. **Demo Social Media Links**
The system comes with 6 pre-configured social media links:
1. Twitter (X) - 𝕏 - https://twitter.com/sharekte
2. LinkedIn - in - https://linkedin.com/company/sharekte
3. Facebook - f - https://facebook.com/sharekte
4. Instagram - 📷 - https://instagram.com/sharekte
5. YouTube - ▶️ - https://youtube.com/@sharekte
6. Email - 📧 - mailto:hello@sharekte.com

## How to Use

### Adding a Social Media Link from Admin Dashboard

1. Navigate to `/admin/social-media` (Admin Dashboard → Social Media Links)
2. Click **"Add Link"** button
3. Choose from:
   - **Predefined Platforms**: Click from the "Available Platforms" grid below
   - **Dropdown Menu**: Select from the "Platform Name" dropdown
   - **Custom Platform**: Type a custom platform name
4. Icon will auto-fill if selecting a predefined platform
5. Enter the URL (e.g., https://instagram.com/yourprofile)
6. (Optional) Add display text like "Follow on Instagram"
7. Toggle "Show on footer" to display on website
8. Click **"Create"** to save

### Editing a Social Media Link

1. Click the **Edit** (pencil) icon on any link
2. Modify the details
3. Click **"Update"** to save changes

### Toggling Link Visibility

1. Click the **Eye/Eye-off** icon to show/hide the link from the website footer
2. Active links appear with a green eye icon

### Deleting a Social Media Link

1. Click the **Delete** (trash) icon
2. Confirm the deletion

### Reordering Links

- Click and drag the **Grip** handle on each card to reorder
- Links display in the footer in this order

## Footer Display

All active social media links automatically appear in the website footer:
- Icons and platform names are displayed
- Links open in new tabs
- Links are displayed in the configured order
- Only active links are shown

## Files Modified

1. **client/lib/social-media.ts**
   - Expanded `SOCIAL_MEDIA_ICONS` to 70+ platforms
   - All API utility functions remain unchanged

2. **server/routes/social-media.ts**
   - Added `getAvailablePlatformsHandler` endpoint
   - Expanded demo data with 6 social links
   - Added `PLATFORM_ICONS` mapping

3. **client/components/AdminSocialLinks.tsx**
   - Added `Select` component for platform selection
   - Added platform categories for quick reference
   - Added visual platform grid with one-click selection
   - Improved form with auto-fill icon functionality

4. **server/index.ts**
   - Registered new `/api/social-media/platforms/available` endpoint

## Customization

### Add More Platforms

Edit `client/lib/social-media.ts` and add to `SOCIAL_MEDIA_ICONS`:
```typescript
"Your Platform": "🎯"
```

### Change Platform Icons

Update the emoji/text in `SOCIAL_MEDIA_ICONS` object.

### Add Platform Categories

Edit the `platformCategories` object in `AdminSocialLinks.tsx` to organize platforms differently.

## Best Practices

1. **Use Standard Icons**: Stick to commonly recognized emojis for consistency
2. **Organize by Category**: Group related platforms together
3. **Keep URLs Valid**: Ensure all URLs are complete and working
4. **Use Display Text**: Add optional display text for context
5. **Order by Importance**: Drag links to show most important platforms first

## Footer Integration

The Footer component (`client/components/Footer.tsx`) automatically:
- Fetches all active social media links from the API
- Displays them in the configured order
- Shows icons and platform names
- Makes links clickable and opens in new tabs
- Filters inactive links automatically

## Technical Details

- **Storage**: File-based persistence in `social-media-settings.json`
- **Sync**: Links are immediately saved to disk
- **API Routes**: RESTful endpoints for all CRUD operations
- **Validation**: Platform and URL are required fields
- **Icon Fallback**: Uses default icon if custom icon not provided
- **Active Status**: Controls visibility on the website footer

## Support

For issues or feature requests, refer to the admin documentation or contact support.
