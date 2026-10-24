# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-20

### Added
- **Decision Engine**: Complete rule-based engine with breakdown for every risk factor
- **Golden Window**: Intelligent finding of best time to go out (16:00-22:00)
- **Temperature Shock Detection**: Alerts for sudden temperature changes vs yesterday
- **Nowcast**: 4-state real-time precipitation forecast (2 hours)
- **Activity Scoring**: Best window calculation for 6 activities (picnic, park, walking, shopping, sports, photography)
- **Car Wash Planner**: Smart recommendation based on 48-72h rain forecast
- **Friend Comparison**: Find overlapping safe windows between profiles
- **Night Sky**: Moon phase and stargazing conditions
- **Pressure Analysis**: Trend detection (rising/falling/steady)
- **Departure Suggestion**: Optimal time to leave based on golden window
- **Wear & Gear Advice**: Personalized clothing and equipment recommendations
- **Alert System**: Wind, fog, ice, air quality, UV warnings
- **PWA Support**: Installable, offline-capable progressive web app
- **Service Worker**: Cache-first for assets, network-first for API
- **RTL Support**: Complete right-to-left layout for Persian
- **Vazirmatn Font**: Persian-optimized typography
- **Glassmorphism Design**: Pastel gradients with frosted glass cards
- **Multi-Profile**: Separate thresholds for "Me" and "Friends"
- **7-Step Onboarding**: Personalized threshold configuration
- **3-Level Export**: Copy weather info at different detail levels
- **Test Fixtures**: 10 scenarios for Android port testing

### Changed
- Complete rewrite of risk calculation with 6-factor breakdown
- Improved golden window algorithm with day/night preference
- Enhanced decision output with reasons and explanations
- Better mobile-first responsive design
- Optimized bundle size (77KB gzipped)

### Technical
- React 18 + TypeScript + Vite
- Tailwind CSS with custom design tokens
- Zustand for state management
- Open-Meteo API (free, no key required)
- Service Worker with intelligent caching strategies
- Full accessibility (WCAG 2.1 AA)

## [1.0.0] - 2024-12-01

### Added
- Initial release
- Basic weather display
- Simple risk assessment
- Single profile support

---

## Version Guidelines

- **Major** (X.0.0): Breaking changes, major features
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, performance improvements

## Release Process

1. Update CHANGELOG.md
2. Bump version in package.json
3. Create git tag: `git tag v2.0.0`
4. Push tag: `git push origin v2.0.0`
5. Auto-deploy via CI/CD
