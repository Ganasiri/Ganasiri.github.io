# Ganasiri

Personal portfolio of Ganasiri M M: a scroll-led single page where scrolling drives the story, mostly vertically, with one pinned section that moves sideways.

Live at **https://ganasiri.github.io**

## Branches

- `main`: the live site. Anything merged here is deployed automatically.
- `code-ganasiri`: working branch. All changes are made here and merged into `main` via pull request.

## Run it

Requires Node 20.19+ (or 22.12+).

```sh
npm install
npm run dev       # local dev server
npm run build     # type-check and build to dist/
npm run preview   # serve the production build
npm run lint      # oxlint
```

## Edit the content

All text lives in [`src/content.ts`](src/content.ts), so you never need to touch a component to update the site.

| Export | Where it shows |
| --- | --- |
| `profile` | Name, role, rotating focus areas, intro line, email, location, links |
| `about` | Big statement, bio paragraphs and the four counters |
| `services` | Stacking cards under "What I do" |
| `projects` | Cards in the sideways-scrolling Work section |
| `experience` | Timeline, oldest first; `marker` is the big rolling year |
| `marquee`, `skills`, `certifications` | Toolbox section |
| `contact` | Closing call to action |

- Wrap words in `*asterisks*` to set them in the italic serif accent.
- Keep `profile.displayName` to one word: it's sized to fill the hero's width.
- Project images go in `public/work/`. The current ones are placeholder illustrations, so swap in real screenshots when you have them (16:10 works best).
- To add LinkedIn or other profiles, add entries to `profile.links`.
- The page title and description for search engines are in `index.html`.

## How the scrolling works

| Section | Effect |
| --- | --- |
| Hero | Letters rise in after the loader and stand on a 3D landscape of data points (Three.js). Scrolling lifts the letters apart and raises the camera until the landscape reads as a flat heatmap |
| About | Words light up one by one as you scroll; the counters count up |
| What I do | Cards stick and stack on top of each other |
| Work | The section pins and vertical scroll moves the cards sideways, with image parallax and a progress counter |
| Experience | The timeline fills as you scroll and the big year rolls to each milestone |
| Toolbox | Rows of tool names slide in opposite directions |
| Contact | Headline lines slide up; the button leans towards the cursor |

The site uses a soft dark theme: graphite (#1E2126) rather than black behind every section, warm off-white (#E6E3DC) text, and steel blue (#6A90B4) as the one pop colour for italic headline words, numbers and indicators. The navigation bar, cards, badges and the email button are glass in the style of iOS 27: a tinted, blurred fill with a lit rim and a soft shadow, added with the `glass` and `glass-blur` classes. Glass turns solid when a visitor's system asks for reduced transparency. Colours and glass settings are at the top of `src/index.css`.

Smooth scrolling uses [Lenis](https://github.com/darkroomengineering/lenis), and the animations use [GSAP](https://gsap.com) ScrollTrigger and SplitText. If a visitor's system asks for reduced motion, the scroll animations are switched off, the Work row becomes a normal sideways scroller and the 3D scene stays still.

## Project structure

```
src/
  content.ts        all site copy
  App.tsx           page order, loader and scroll lock
  index.css         colours, fonts, shared styles
  lib/gsap.ts       GSAP plugin setup
  hooks/            media queries, text fitting, line reveals
  components/       loader, navbar, cursor, smooth scroll, 3D scene, small UI parts
  sections/         one component + stylesheet per section
public/
  work/             project cover images
```

## Deploying

GitHub Pages serves the site from this repository at https://ganasiri.github.io. Every push to `main`, which includes every merged pull request, runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). It installs dependencies, runs `npm run build` and publishes `dist/`. You can follow each deploy in the repository's Actions tab, and redeploy by hand there with "Run workflow".

The site sits at the domain root, so `base` in `vite.config.ts` stays at its default of `/`.

## Credits

The idea of a scroll-led, vertical-plus-horizontal portfolio was inspired by [Moncy Yohannan's portfolio](https://github.com/MoncyDev/Portfolio-Website). Its license allows inspiration but not copying its design, code or assets, so everything here is original: code, layout, 3D scene and artwork.
