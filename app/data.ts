export type Project = {
  name: string;
  kind: string;
  url: string;
  year: string;
  status: 'active' | 'archived' | 'experiment';
  description: string;
  detail: string;
  tech: string;
  role?: string;
};

export type Experience = {
  id: string;
  organization: string;
  role: string;
  period: string;
  location: string;
  website?: string;
  logo?: string;
  description: string;
  highlights: string[];
  relatedProject?: string;
};

export type Award = {
  year: string;
  name: string;
  issuer?: string;
  description: string;
};

export const projects: Project[] = [
  {
    name: 'EduGrants',
    kind: 'EdTech platform',
    url: 'https://edugrants.uz',
    year: 'Aug 2023 — present',
    status: 'active',
    role: 'Founder & CEO',
    description: 'A scholarship-discovery platform helping students in Uzbekistan find verified international opportunities.',
    detail: 'The project grew into a web platform, Telegram community and EduCast interview series. Recent public updates place the ecosystem at 50,000+ users.',
    tech: 'Product · Community · Partnerships · Web',
  },
  {
    name: 'Empira',
    kind: 'AI / EdTech product',
    url: 'https://empira.uz',
    year: 'Sept 2026 — present',
    status: 'active',
    role: 'Co-Founder & CEO',
    description: 'An AI virtual laboratory that turns textbook pages into interactive 3D experiments with an Uzbek AI tutor.',
    detail: 'Built from scratch in 72 hours with JaydariTech and won 1st place in the EdTech track at the National AI Hackathon.',
    tech: 'AI · EdTech · 3D · Product',
  },
  {
    name: 'Atlon.uz',
    kind: 'Youth platform',
    url: 'https://atlon.uz',
    year: 'Jul 2026 — present',
    status: 'active',
    description: 'A youth platform centered on leadership, volunteering and real-world project experience.',
    detail: 'LinkedIn lists 500+ participants, 50+ volunteers, 12 cities and 20+ events across its programs.',
    tech: 'Youth · Leadership · Community · Events',
  },
  {
    name: 'MentorGo',
    kind: 'Mentoring platform',
    url: 'https://mentorgo.uz',
    year: 'Dec 2024 — present',
    status: 'active',
    role: 'Co-Founder & CTO',
    description: 'A platform connecting ambitious students with mentors who have won major international scholarships.',
    detail: 'Built with a four-person team; the platform reached 3,000+ users and facilitated hundreds of mentoring sessions.',
    tech: 'Web · Mentorship · Product · AI',
  },
  {
    name: 'Lumora',
    kind: 'IT case competitions',
    url: '',
    year: 'Jul 2025 — Dec 2025',
    status: 'archived',
    role: 'Co-Founder & Media Director',
    description: 'A national competition format where student teams solve real IT cases and defend working solutions.',
    detail: 'Organized 15 competitions across 10 regions, engaging 1,000+ students and partnering with industry organizations.',
    tech: 'Community · Events · Partnerships · Media',
  },
  {
    name: 'Friendship Checker Bot',
    kind: 'Telegram bot',
    url: '',
    year: 'Feb 2026',
    status: 'experiment',
    description: 'A playful Telegram bot for personalized friendship quizzes, anonymous messages and compatibility checks.',
    detail: 'Designed as a viral-friendly social experiment with quiz sharing and leaderboards.',
    tech: 'Telegram bot · Viral loops · Product experiment',
  },
  {
    name: 'Quoteum',
    kind: 'Interactive web experiment',
    url: '',
    year: 'Jan 2026',
    status: 'experiment',
    description: 'A museum of quotes that lets visitors browse curated inspiration based on their mood.',
    detail: 'Built as a polished interactive experience with animation, navigation and an admin toolkit.',
    tech: 'Web · UI/UX · Content · Experiment',
  },
  {
    name: 'DavomatAI',
    kind: 'AI prototype',
    url: '',
    year: 'Jun 2024 — Jul 2024',
    status: 'archived',
    role: 'AI Researcher & Engineer',
    description: 'An AI-powered attendance system developed at New Uzbekistan University.',
    detail: 'The prototype reduced educators’ manual record-keeping by about four hours per month during the pilot.',
    tech: 'Computer vision · AI · Prototype',
  },
  {
    name: 'HospitalBookingCoom',
    kind: 'Health-tech platform',
    url: '',
    year: 'Feb 2024 — Jul 2024',
    status: 'archived',
    description: 'A hospital service booking project for consultations and operations.',
    detail: 'Built with a 14-person team of programmers, designers and researchers; the project was later stopped because of financial constraints.',
    tech: 'Web · Health-tech · Team project',
  },
  {
    name: 'Ijodkorlar Jamiyati',
    kind: 'Creator platform',
    url: '',
    year: 'Feb 2024 — Apr 2024',
    status: 'archived',
    description: 'A platform for creators to upload, showcase and share their work with a broader audience.',
    detail: 'An early community-building and product experiment focused on Uzbek creators.',
    tech: 'Web · Creators · Community',
  },
  {
    name: 'StartUpper',
    kind: 'Startup platform concept',
    url: '',
    year: 'Early project',
    status: 'experiment',
    description: 'A platform concept for early-stage founders to collaborate and access startup opportunities.',
    detail: 'Focused on structured collaboration, startup team formation and opportunity discovery.',
    tech: 'Startups · Collaboration · Product concept',
  },
  {
    name: 'WebLaunch',
    kind: 'Business competition project',
    url: '',
    year: 'Dec 2024',
    status: 'archived',
    description: 'A business project created for Target International School’s national business championship.',
    detail: 'Won 1st place among five school branches; Nurbek led strategy, development and presentation.',
    tech: 'Business · Product · Pitching',
  },
];

export const experiences: Experience[] = [
  {
    id: 'edugrants',
    organization: 'EduGrants',
    role: 'Founder & CEO',
    period: 'Aug 2023 — present',
    location: 'Uzbekistan',
    website: 'https://edugrants.uz',
    logo: 'https://edugrants.uz/logo.jpg',
    description: 'Founded and scaled a scholarship-discovery platform and community connecting young people with verified international opportunities.',
    highlights: ['50,000+ users across the ecosystem', '$10,000+ revenue from advertising and partnerships', 'EduCast interview series and nationwide scholarship marathons'],
    relatedProject: 'EduGrants',
  },
  {
    id: 'empira',
    organization: 'Empira (JaydariTech)',
    role: 'Co-Founder & CEO',
    period: 'Sept 2026 — present',
    location: 'Uzbekistan',
    website: 'https://empira.uz',
    logo: 'https://empira.uz/favicon.ico',
    description: 'Building an AI-powered virtual laboratory for school students.',
    highlights: ['Built from scratch in 72 hours', '1st place, National AI Hackathon — EdTech track', 'Earned a Startup Garage place and school rollout partnerships'],
    relatedProject: 'Empira',
  },
  {
    id: 'startup-ambassadors',
    organization: 'Startup Ambassadors',
    role: 'Project Manager',
    period: '2026',
    location: 'Youth Affairs Agency of Uzbekistan',
    website: 'https://www.startupambassadors.uz',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Startup_Ambassadors_2.png',
    description: 'Managed a nationwide youth startup network backed by the Youth Affairs Agency and Yoshlar Ventures.',
    highlights: ['Joined as assistant manager and later became Project Manager', 'Public LinkedIn update reports 500+ events and 10,000+ young people engaged', 'Received a Best Employee award during the placement'],
  },
  {
    id: 'digital-generation',
    organization: 'Digital Generation Uzbekistan',
    role: 'AI Mentor',
    period: 'Mar 2024 — present',
    location: 'Uzbekistan',
    website: 'https://digitalgeneration.uz',
    logo: 'https://digitalgeneration.uz/static/img/logo.png',
    description: 'Mentor and educator in national AI and no-code camps.',
    highlights: ['Mentored 350+ students across 4 national camps', 'Designed inclusive curriculum for underrepresented and disabled youth', 'Taught AI and no-code tools'],
  },
  {
    id: 'lumora',
    organization: 'Lumora',
    role: 'Co-Founder & Media Director',
    period: 'Jul 2025 — Dec 2025',
    location: 'Uzbekistan',
    website: 'https://t.me/thelumoraa',
    description: 'Co-built a national IT case competition community.',
    highlights: ['15 competitions across 10 regions', '1,000+ students engaged', '15 industry partners and 5,000+ online reach'],
    relatedProject: 'Lumora',
  },
  {
    id: 'mentorgo',
    organization: 'MentorGo',
    role: 'Co-Founder & CTO',
    period: 'Dec 2024 — Nov 2025',
    location: 'Uzbekistan',
    website: 'https://mentorgo.uz',
    logo: 'https://mentorgo.uz/favicon.ico',
    description: 'Built the mentoring platform with a four-person team.',
    highlights: ['3,000+ users', '200+ monthly mentoring sessions during the period', 'Students collectively secured $1M+ in scholarships'],
    relatedProject: 'MentorGo',
  },
  {
    id: 'newuu',
    organization: 'New Uzbekistan University',
    role: 'AI Researcher & Engineer',
    period: 'Jun 2024 — Jul 2024',
    location: 'Tashkent, Uzbekistan',
    website: 'https://newuu.uz',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Logo_New_Uzbekistan_University.jpg/960px-Logo_New_Uzbekistan_University.jpg',
    description: 'Worked on applied AI research and engineering, including the DavomatAI attendance prototype.',
    highlights: ['Developed DavomatAI', 'Reduced manual attendance record-keeping by about 4 hours per month in the pilot'],
    relatedProject: 'DavomatAI',
  },
  {
    id: 'family-farm',
    organization: 'Family Farm',
    role: 'Co-Manager',
    period: 'Ongoing',
    location: 'Namangan, Uzbekistan',
    description: 'Co-manage a two-hectare apple orchard and sell harvest at the local bazaar.',
    highlights: ['Hands-on agriculture', 'Small-business operations', 'Local sales and harvest management'],
  },
];

export const awards: Award[] = [
  {year: '2026', name: 'National AI Hackathon — 1st Place, EdTech', issuer: 'National AI Hackathon', description: 'Led JaydariTech to first place with Empira after a 72-hour build.'},
  {year: '2026', name: '100M UZS Grant', issuer: 'Specialized Schools Agency', description: 'Project team secured a 100,000,000 UZS grant for an educational initiative.'},
  {year: '2026', name: 'Mirzo Ulug‘bek Vorislari — Republic Winner', issuer: 'National competition', description: 'Placed in the top 35 out of 48,000+ applicants across Uzbekistan.'},
  {year: '2025', name: 'TOP3 Project in Startup Day', issuer: 'IT Park Uzbekistan', description: 'MentorGo placed first among 25 projects in the referenced Startup Day competition.'},
  {year: '2025', name: 'LaunchX — 99% Scholarship', issuer: 'LaunchX', description: 'Received a 99% scholarship for the entrepreneurship programme.'},
  {year: '2024', name: '1st Place — Business Championship', issuer: 'Target International School', description: 'Won with WebLaunch among five school branches.'},
  {year: '2024', name: 'Full Tuition Scholarship', issuer: 'Target International School', description: 'Awarded a full annual school scholarship.'},
  {year: '2023', name: 'Top 100 Student of Uzbekistan', issuer: 'Ministry of Education', description: 'Recognized nationally for academics, leadership and contributions to education and tech.'},
  {year: '2023', name: 'Kelajak Yoshlari', issuer: 'Najot Ta’lim & Cambridge Learning Centre', description: 'Won full scholarships through the national selection programme.'},
  {year: '2021', name: 'Khiso Olympiad — Regional 1st Place', description: 'Placed first in the regional stage.'},
];
