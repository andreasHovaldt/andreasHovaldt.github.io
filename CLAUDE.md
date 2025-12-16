# CLAUDE.md - AI Assistant Guide for andreasHovaldt.github.io

## Project Overview

This is a **GitHub Pages** personal website repository for Andreas Højrup. The site is deployed at:
- GitHub Pages URL: `https://andreashovaldt.github.io`
- Custom domain: `pages.dreez.dk` (configured via CNAME)

**Project Type:** Static personal website
**License:** MIT License (Copyright 2025 Andreas Højrup)
**Primary Language:** HTML/CSS
**Deployment:** Automatic via GitHub Pages

## Repository Structure

```
andreasHovaldt.github.io/
├── .git/                 # Git repository metadata
├── CNAME                 # Custom domain configuration (pages.dreez.dk)
├── LICENSE               # MIT License file
├── README.md             # Repository readme (minimal)
├── index.html            # Main landing page
└── CLAUDE.md             # This file - AI assistant guide
```

### Key Files

#### `index.html`
- **Purpose:** Main landing page for the website, now featuring an interactive game
- **Structure:** Single-page HTML document with embedded CSS and JavaScript
- **Features:**
  - Responsive design with viewport meta tag
  - Centered container layout using Flexbox
  - Clean, minimal design with white container on light gray background
  - Welcome message with GitHub profile link
  - Complete interactive game implemented with canvas-based graphics and game logic
  - Self-contained (no external dependencies)

#### `CNAME`
- **Purpose:** Custom domain configuration for GitHub Pages
- **Content:** `pages.dreez.dk`
- **Critical:** Do NOT modify or delete unless explicitly instructed to change the domain

#### `LICENSE`
- **Type:** MIT License
- **Copyright:** 2025 Andreas Højrup
- **Note:** Maintain copyright information when making changes

#### `README.md`
- **Purpose:** Repository description
- **Content:** Currently minimal (just repository name)
- **Best Practice:** Can be expanded with project information if requested

## Development Workflow

### Branch Strategy

- **Main Branch:** `main` (or master) - Production branch for GitHub Pages
- **Feature Branches:** Use `claude/` prefix for AI-assisted development
  - Format: `claude/claude-md-<session-id>`
  - Example: `claude/claude-md-mj8fontwdv2af1nh-2SQcH`

### Making Changes

1. **Always work on feature branches** - Never commit directly to main unless explicitly requested
2. **Read before editing** - Always read files before making modifications
3. **Test locally** - Preview HTML changes by opening files in a browser
4. **Commit with clear messages** - Use descriptive commit messages that explain the change
5. **Push and create PR** - Push to the feature branch and create a pull request for review

### Git Commands Reference

```bash
# Check current branch and status
git status

# Create and switch to feature branch
git checkout -b claude/feature-name

# Stage changes
git add <file>

# Commit changes
git commit -m "Description of changes"

# Push to remote (use -u for new branches)
git push -u origin <branch-name>

# Create pull request (using gh CLI)
gh pr create --title "PR Title" --body "Description"
```

## Design Conventions

### HTML/CSS Standards

1. **HTML5 Doctype** - Use `<!DOCTYPE html>`
2. **Semantic HTML** - Use appropriate semantic elements
3. **Responsive Design** - Include viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
4. **Embedded CSS** - Current pattern uses `<style>` tags in `<head>` for simplicity
5. **Accessibility** - Use proper heading hierarchy, alt text for images, semantic markup

### Current Design System

- **Font Family:** Arial, sans-serif (system fonts for performance)
- **Background Color:** `#f4f4f4` (light gray)
- **Container Background:** `white`
- **Text Color:** Default black for headings, `#555` for paragraphs
- **Link Color:** `#0366d6` (GitHub blue)
- **Border Radius:** `8px` for containers
- **Box Shadow:** `0 0 10px rgba(0,0,0,0.1)` for subtle depth
- **Container Padding:** `30px`
- **Layout:** Flexbox-based centering (both horizontal and vertical)

## AI Assistant Guidelines

### When Making Changes

1. **Preserve Structure** - Maintain the existing design patterns unless explicitly asked to change them
2. **Minimize Dependencies** - Keep the site self-contained; avoid adding external libraries unless necessary
3. **Mobile-First** - Ensure all changes work on mobile devices
4. **Performance** - Keep the site lightweight and fast
5. **Simplicity** - This is a personal landing page; avoid over-engineering

### Common Tasks

#### Adding New Pages
```html
<!-- Follow the same structure as index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page Title</title>
  <style>
    /* Reuse design system variables */
  </style>
</head>
<body>
  <!-- Content here -->
</body>
</html>
```

#### Updating Content
- **Read first:** Always read `index.html` before making changes
- **Preserve style:** Maintain the existing CSS unless redesign is requested
- **Test links:** Ensure all links work and open in appropriate targets

#### Adding Assets
- Create appropriate directories (`/css`, `/js`, `/images`, `/assets`)
- Keep assets organized and named descriptively
- Optimize images before adding (compress for web)
- Update paths in HTML files accordingly

### Testing Checklist

Before committing changes:
- [ ] HTML validates (proper structure, closed tags)
- [ ] CSS is properly scoped and doesn't break layout
- [ ] Links work and point to correct destinations
- [ ] Responsive design works (test on mobile viewport)
- [ ] No console errors in browser
- [ ] Accessible (proper headings, alt text, semantic markup)
- [ ] Fast loading (no unnecessary dependencies)

## Deployment

### GitHub Pages Configuration

- **Deployment:** Automatic from main branch
- **Custom Domain:** Configured via CNAME file (`pages.dreez.dk`)
- **HTTPS:** Automatically enabled by GitHub Pages
- **Build Process:** None required (static HTML)

### Deployment Process

1. Changes are merged to main branch
2. GitHub Pages automatically deploys within 1-2 minutes
3. Site is live at both `andreashovaldt.github.io` and `pages.dreez.dk`

### Troubleshooting Deployment

- **CNAME issues:** Ensure CNAME file contains only the domain (no protocol or path)
- **404 errors:** Check file paths are correct and case-sensitive
- **DNS issues:** Custom domain DNS must point to GitHub Pages servers
- **Cache:** Browser cache may need clearing to see changes

## Project History

### Commit Timeline

1. **191f623** - Initial commit
2. **3843f28** - Hello world (initial HTML content)
3. **0e12be4** - Update index.html (refined content)
4. **0d26d51** - Create CNAME (custom domain setup)

## Best Practices for AI Assistants

### DO:
- ✅ Read files before editing them
- ✅ Maintain consistent code style with existing files
- ✅ Use descriptive commit messages
- ✅ Test changes before committing
- ✅ Work on feature branches
- ✅ Ask for clarification when requirements are unclear
- ✅ Keep changes focused and minimal
- ✅ Preserve the existing design system
- ✅ Maintain accessibility standards

### DON'T:
- ❌ Modify CNAME without explicit instruction
- ❌ Add unnecessary dependencies or frameworks
- ❌ Commit directly to main branch
- ❌ Over-engineer simple solutions
- ❌ Remove or modify LICENSE without permission
- ❌ Break responsive design
- ❌ Add features that weren't requested
- ❌ Ignore existing code patterns
- ❌ Push changes without testing

## Future Considerations

Potential enhancements (only implement if requested):

1. **Multi-page structure:** About, Projects, Contact pages
2. **CSS organization:** Separate stylesheet (`style.css`)
3. **JavaScript functionality:** Interactive elements, animations
4. **Build process:** Sass/Less, minification, bundling
5. **Additional content:** Blog, portfolio items, resume
6. **Analytics:** Google Analytics or similar (privacy-conscious)
7. **SEO optimization:** Meta tags, Open Graph, structured data
8. **Progressive enhancement:** Service workers, offline support

## Contact & Repository Information

- **Owner:** Andreas Højrup
- **GitHub:** https://github.com/andreasHovaldt
- **Repository:** https://github.com/andreasHovaldt/andreasHovaldt.github.io
- **Website:** https://pages.dreez.dk

## Notes for AI Assistants

- This is a personal website, so changes should align with the owner's preferences
- When in doubt, ask before making significant changes
- Keep the site simple, fast, and accessible
- Respect the MIT license and copyright
- Follow GitHub Pages best practices
- Maintain the clean, minimal aesthetic

---

**Last Updated:** 2025-12-16
**Document Version:** 1.0.0
