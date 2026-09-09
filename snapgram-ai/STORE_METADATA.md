# InstaSnap Mobile — Google Play Store Metadata & Submission Checklist

## 1. App Identity & Store Listing

| Field | Production Value | Status |
|---|---|---|
| **App Title** | InstaSnap | READY |
| **Short Description** | Next-gen social media with AI tools, real-time messaging, stories & live streams. | READY |
| **Full Description** | InstaSnap is a next-generation social platform designed for creators and communities. Share photos, 24-hour stories, high-energy reels, and broadcast live video with real-time chat. Protect personal memories in your encrypted Vault, explore trending hashtags, generate AI captions & art, and connect through instant messaging with disappearing snaps. | READY |
| **Package Name** | `com.instasnap.mobile` | CONFIGURED |
| **Version Name** | `1.0.0` | CONFIGURED |
| **Version Code** | `1` | CONFIGURED |
| **Default Language** | English (United States) — en-US | CONFIGURED |
| **Category** | Social / Social Networking | READY |
| **Tags** | Social Networking, Photo Sharing, Video Chat, Live Streaming, AI Assistant | READY |

---

## 2. Store Graphic Assets

| Asset | Specifications | Location / Status |
|---|---|---|
| **App Icon** | 512 x 512 px, 32-bit PNG with alpha | `mobile/assets/icon.png` (READY) |
| **Adaptive Icon** | 432 x 432 px (foreground, background, monochrome) | `mobile/assets/android-icon-*.png` (READY) |
| **Splash Screen** | 1284 x 2778 px, high-res PNG | `mobile/assets/splash-icon.png` (READY) |
| **Feature Graphic** | 1024 x 500 px, JPG or 24-bit PNG (no alpha) | **REQUIRED** (Upload in Google Play Console) |
| **Phone Screenshots** | Minimum 4 screenshots (1080 x 1920 or 1080 x 2400) | **REQUIRED** (Capture from device / upload in Console) |
| **7-inch Tablet Screenshots** | Minimum 1 screenshot | OPTIONAL |
| **10-inch Tablet Screenshots** | Minimum 1 screenshot | OPTIONAL |

---

## 3. URLs & Legal Declarations

| Field | Production Target | Status |
|---|---|---|
| **Privacy Policy URL** | `https://instasnap.app/privacy` | **REQUIRED** (Host before submission) |
| **Terms of Service URL** | `https://instasnap.app/terms` | **REQUIRED** (Host before submission) |
| **Support Email** | `support@instasnap.app` | **REQUIRED** (Google Play contact email) |
| **Website** | `https://instasnap.app` | CONFIGURED |

---

## 4. Android SDK & Hardware Targets

| Configuration | Target Value | Compliant |
|---|---|---|
| **Minimum SDK (minSdkVersion)** | `24` (Android 7.0 Nougat) | YES |
| **Target SDK (targetSdkVersion)** | `35` (Android 15) | YES (Meets Google Play Aug 2026 requirement) |
| **Compile SDK (compileSdkVersion)**| `35` | YES |
| **64-bit Architecture Support** | `arm64-v8a`, `x86_64` | YES (Hermes + React Native 0.86.2) |
| **App Bundle Format** | Android App Bundle (`.aab`) | YES |

---

## 5. Android Permissions & Justifications

| Permission | Purpose / Justification for Reviewers |
|---|---|
| `android.permission.CAMERA` | Allows users to capture photos, record stories/reels, and broadcast live video streams. |
| `android.permission.RECORD_AUDIO` | Enables microphone recording for reels, voice notes in chat, and live streaming audio. |
| `android.permission.MODIFY_AUDIO_SETTINGS` | Optimizes audio hardware routing during WebRTC live streaming sessions. |
| `android.permission.POST_NOTIFICATIONS` | Delivers real-time notifications for incoming direct messages, stream alerts, and follow requests. |
| `android.permission.READ_MEDIA_IMAGES` | Allows users to select and upload photos from their gallery to posts, stories, and the Vault. |
| `android.permission.READ_MEDIA_VIDEO` | Enables video selection from gallery for publishing reels and video posts. |
| `android.permission.ACCESS_NETWORK_STATE` | Verifies internet connectivity state for automatic socket reconnection. |
| `android.permission.VIBRATE` | Provides haptic feedback and alert vibration for incoming direct messages. |

---

## 6. Google Play Data Safety Declarations

| Data Category | Data Type | Collected | Shared | Purpose | Security |
|---|---|---|---|---|---|
| **Personal Info** | Name, Email, Username | Yes | No | Account management, Authentication | Encrypted in transit (HTTPS/WSS) |
| **Photos and Videos** | Photos, Videos, Snaps | Yes | No | App functionality (feed, reels, vault) | Encrypted in transit; Vault encrypted |
| **Messages** | Direct Chat messages | Yes | No | App functionality (1:1 messaging) | Encrypted in transit; auto-expiring snaps |
| **App Activity** | Interactions, Likes, Saves | Yes | No | Analytics & Personalization | Encrypted in transit |
| **Device IDs** | Push token, Device ID | Yes | No | Push notification delivery | Encrypted in transit |
| **Data Deletion Request** | In-app account deletion (`/app/settings`) | Yes | — | Users can permanently delete their account and data | Supported |

---

## 7. Content Rating & Monetization Disclosures

- **Content Rating**: **Teen / 12+** (User-generated content, social interaction, unmoderated chat filtering).
- **Target Age**: 13 and older (Requires COPPA compliance declaration).
- **Contains Ads**: **No** (InstaSnap is an ad-free social platform).
- **In-App Purchases / Subscriptions**: Supported via Creator Monetization & Patron badges.
