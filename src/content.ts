/**
 * Every piece of copy on the site lives in this file, so updating the
 * portfolio never means touching a component.
 *
 * Text wrapped in *asterisks* is set in the italic serif accent face.
 */

export type Link = { label: string; href: string }

export type Stat = {
  /** The number that counts up; prefix and suffix stay fixed. */
  value: number
  prefix?: string
  suffix?: string
  /** Keep to about three words so it reads at a glance. */
  label: string
  detail?: string
}

export type Fact = { label: string; value: string }

export type Service = { title: string; description: string; tags: string[] }

/** Publication state of a research paper, shown as a badge on its card. */
export type PaperStatus = 'published' | 'accepted'

export type Project = {
  /** Short name shown large on the card. */
  title: string
  /** Full title, e.g. the paper's title. */
  subtitle: string
  /** Set for research papers only. */
  status?: PaperStatus
  kind: string
  /** Venue, year or status, e.g. "AIDE 2023" or "Paper in preparation". */
  meta: string
  summary: string
  /** The one number that sums the project up. */
  metric: { value: string; label: string }
  tools: string[]
  /** Image path inside /public, or an absolute URL. */
  image: string
  /** Optional link to a paper, demo or repository. */
  href?: string
}

export type Milestone = {
  /** Shown on the large rolling counter beside the timeline. */
  marker: string
  period: string
  title: string
  organisation: string
  description: string
}

export type SkillGroup = { title: string; items: string[] }

export const profile = {
  name: 'Ganasiri M M',
  /** Set huge across the hero, so keep it to one word. */
  displayName: 'Ganasiri',
  role: 'Product Analyst',
  /** Cycles after the role in the hero. */
  focus: ['Data Analytics', 'Artificial Intelligence', 'Data Science'],
  intro: 'I turn product data into decisions, and build AI that people can *trust*.',
  location: 'Bengaluru, India',
  /** IANA time zone for the live clock widget in the hero. */
  timeZone: 'Asia/Kolkata',
  email: 'mmganasiri30@gmail.com',
  /** Profiles listed under "Elsewhere" in Contact; the block hides when empty. */
  links: [
    // { label: 'LinkedIn', href: 'https://www.linkedin.com/in/your-handle' },
  ] as Link[],
}

/** Hero buttons and widget labels. The widgets' facts come from
 *  `experience`, `profile` and `projects`, so they stay in step. */
export const hero = {
  primaryCta: 'See my work',
  secondaryCta: 'Email me',
  widgets: {
    now: 'Currently',
    time: 'Local time',
    research: 'Research',
  },
}

/** In-page navigation. Each id must match a section id. */
export const navigation = [
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
]

export const about = {
  /** One short line, set very large. */
  statement: 'I measure what matters, then *move* it.',
  summary: 'At Quest Alliance, I work across product analytics, machine learning and Responsible AI.',
  stats: [
    { value: 95, suffix: '%', label: 'Engagement', detail: 'up from 74%' },
    { value: 37, prefix: '−', suffix: '%', label: 'Time to first action', detail: 'after onboarding fixes' },
    { value: 40, prefix: '+', suffix: '%', label: 'RAI score gain', detail: 'for a RAG assistant' },
    { value: 3, suffix: '×', label: 'Faster AI delivery', detail: 'three months to one' },
  ] satisfies Stat[],
  facts: [
    { label: 'Studied', value: 'B.E. AI & Data Science · CGPA 8.29' },
    { label: 'Research', value: '2 papers published · 1 accepted' },
    { label: 'Off the clock', value: 'Fashion team lead · 400+ volunteer hours' },
  ] satisfies Fact[],
}

export const servicesSection = {
  label: 'What I do',
  title: 'Built on *evidence*',
}

export const services: Service[] = [
  {
    title: 'Product analytics',
    description:
      'Analytics frameworks that follow a product from introduction to outcomes, built on SQL datasets, ETL pipelines, A/B test analysis and dashboards leadership can act on.',
    tags: ['SQL', 'A/B testing', 'Power BI', 'Superset'],
  },
  {
    title: 'Machine learning & forecasting',
    description:
      'Forecasting and classification models, from SARIMAX and LSTMs to neural networks and ensembles, benchmarked on real business and research data.',
    tags: ['TensorFlow', 'Keras', 'scikit-learn', 'XGBoost'],
  },
  {
    title: 'Responsible & explainable AI',
    description:
      'Evaluation baselines, golden datasets and guardrails for AI assistants, plus LIME and SHAP explanations that show why a model decided what it did.',
    tags: ['RAI evaluation', 'Golden datasets', 'LIME', 'SHAP'],
  },
  {
    title: 'AI product engineering',
    description:
      'Data models, software design documents and agent-driven workflows that take AI products from idea to launch.',
    tags: ['Agentic AI', 'RAG', 'FastAPI', 'Docker'],
  },
]

export const workSection = {
  label: 'Projects & research',
  title: 'Selected *work*',
}

/** Badge text for research papers, keyed by `Project.status`. */
export const paperStatus: Record<PaperStatus, string> = {
  published: 'Published paper',
  accepted: 'Accepted · in publication',
}

export const projects: Project[] = [
  {
    title: 'Conversion forecasting',
    subtitle: 'Forecast Conversion in Digital Marketing Using Artificial Neural Network',
    status: 'accepted',
    kind: 'First author',
    meta: 'INCIP 2026 · IEEE',
    summary:
      'A nine-layer neural network trained on 8,000 marketing records that beat Random Forest and Logistic Regression, with LIME surfacing the ten strongest conversion drivers.',
    metric: { value: '0.92', label: 'F1-score · AUC 0.91' },
    tools: ['Neural networks', 'LIME', 'Random Forest', 'Logistic Regression'],
    image: '/work/conversion.svg',
  },
  {
    title: 'Lung cancer prognosis',
    subtitle: 'Improved Lung Cancer Prognosis via Hyperparameter Tuning on ML Classification Algorithms',
    status: 'published',
    kind: 'Co-author',
    meta: 'CODE-AI 2024 · MIT Bengaluru',
    summary:
      'Compared more than 15 classifiers, tuned a Random Forest to the top result and explained its predictions with LIME and SHAP.',
    metric: { value: '93.5%', label: 'Accuracy · 0.95 F1' },
    tools: ['Random Forest', 'Hyperparameter tuning', 'LIME', 'SHAP'],
    image: '/work/lung.svg',
    href: 'https://doi.org/10.1201/9781003587392-35',
  },
  {
    title: 'UAV flight mode detection',
    subtitle: 'UAV Flight-Mode Classification Using CNN Transfer Learning',
    status: 'published',
    kind: 'First author',
    meta: 'AIDE 2023',
    summary:
      'VGG16 transfer learning on DroneRF signals lifted flight-mode accuracy over prior work from 46.8% to 87.3%, with 100% UAV detection and 88.6% accuracy across four UAV types.',
    metric: { value: '87.3%', label: 'Flight-mode accuracy' },
    tools: ['VGG16', 'Transfer learning', 'CNN', 'DroneRF'],
    image: '/work/uav.svg',
    href: 'https://doi.org/10.1063/5.0262989',
  },
  {
    title: 'GRACE',
    subtitle: 'Guided Response Assistant for Care and Empathy',
    kind: 'Healthcare platform',
    meta: 'Paper in preparation',
    summary:
      'Full-stack healthcare platform with OCR prescription digitisation, medication reminders and an AI chatbot. 480 ms average response under 100 concurrent users; 92% of pilot users rated it easy to use.',
    metric: { value: '91%+', label: 'OCR accuracy' },
    tools: ['Angular', 'FastAPI', 'MongoDB Atlas', 'EasyOCR', 'Docker'],
    image: '/work/grace.svg',
  },
  {
    title: 'Cloud storage selection',
    subtitle: 'Smart Cloud Storage Selection Using Fuzzy AHP and Fuzzy TOPSIS',
    kind: 'Decision science',
    meta: 'Unpublished study',
    summary:
      'Weighted six criteria with Fuzzy AHP, with security ranked highest, then ranked iCloud, Mega, Google Drive and OneDrive with Fuzzy TOPSIS. OneDrive came first.',
    metric: { value: '0.57', label: 'Top closeness coefficient' },
    tools: ['Fuzzy AHP', 'Fuzzy TOPSIS', 'Multi-criteria analysis'],
    image: '/work/cloud.svg',
  },
]

export const experienceSection = {
  label: 'Timeline',
  title: 'Experience & *education*',
}

/** Oldest first, so the timeline reads forward as you scroll. */
export const experience: Milestone[] = [
  {
    marker: '2021',
    period: '2021 – 2025',
    title: 'B.E. Artificial Intelligence & Data Science',
    organisation: 'Global Academy of Technology, Bengaluru',
    description:
      'Graduated with a CGPA of 8.29/10, with A+ grades in Predictive and Time Series Analysis, Big Data Analytics, Data Visualization with Tableau and Machine Learning II.',
  },
  {
    marker: '2024',
    period: 'Oct 2024 – Mar 2025',
    title: 'AI/ML & Data Science Intern',
    organisation: 'Bosch Limited',
    description:
      'Benchmarked SARIMAX, LSTM, neural-network and ensemble models for power-tools sales forecasting, and built a Power BI dashboard with automated Python reporting that cut decision-making time by 40%.',
  },
  {
    marker: 'Now',
    period: 'Jul 2025 – Present',
    title: 'Product Analyst',
    organisation: 'Quest Alliance, Bengaluru',
    description:
      'Built the product analytics framework, raised engagement on a learning product from 74% to 95%, set Responsible AI baselines for a RAG-based assistant and drove core development of an AI product for government-school teachers.',
  },
]

export const stackSection = {
  label: 'Skills',
  title: 'Tools I *reach* for',
}

/** Words that sweep across the screen as you scroll through the toolbox. */
export const marquee = [
  'Python',
  'SQL',
  'Power BI',
  'TensorFlow',
  'Tableau',
  'scikit-learn',
  'RAG',
  'XGBoost',
  'LIME',
  'SHAP',
  'Agentic AI',
  'FastAPI',
  'Keras',
  'Pandas',
  'LSTM',
  'Docker',
  'SARIMAX',
  'MongoDB',
]

export const skills: SkillGroup[] = [
  { title: 'Programming', items: ['Python', 'SQL', 'TypeScript'] },
  {
    title: 'Analytics & BI',
    items: ['Power BI', 'Tableau', 'Apache Superset', 'Pandas', 'Matplotlib', 'ETL pipelines', 'A/B testing'],
  },
  {
    title: 'Machine learning & AI',
    items: ['TensorFlow', 'Keras', 'scikit-learn', 'XGBoost', 'LSTM', 'SARIMAX', 'Transfer learning', 'RAG', 'Agentic AI'],
  },
  {
    title: 'Responsible AI',
    items: ['RAI evaluation', 'Golden Dataset evaluation', 'LIME', 'SHAP'],
  },
  {
    title: 'Engineering & tools',
    items: ['FastAPI', 'Angular', 'MySQL', 'MongoDB Atlas', 'Docker', 'GitHub Actions', 'Git', 'AI-assisted development'],
  },
]

export const certifications = [
  'Data Science for Engineers · NPTEL',
  'Machine Learning Foundations · Infosys Springboard',
  'Python Foundation · Infosys Springboard',
  'IBMZ Datathon',
]

export const contact = {
  label: 'Contact',
  title: "Let's *talk*.",
  blurb: 'Questions about a project, a role or a research idea? My inbox is open.',
  cta: 'Email me',
}
