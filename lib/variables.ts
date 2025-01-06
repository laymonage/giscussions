export const env = {
  app_id: process.env.GITHUB_APP_ID,
  client_id: process.env.GITHUB_CLIENT_ID,
  client_secret: process.env.GITHUB_CLIENT_SECRET,
  installation_id: process.env.GITHUB_INSTALLATION_ID,
  token: process.env.GITHUB_TOKEN,
  private_key: process.env.GITHUB_PRIVATE_KEY,
  encryption_password: process.env.ENCRYPTION_PASSWORD,
  app_host: process.env.NEXT_PUBLIC_GISCUS_APP_HOST as `https://${string}`,
  postgrest_url: process.env.POSTGREST_URL,
  postgrest_role: process.env.POSTGREST_ROLE,
  postgrest_secret: process.env.POSTGREST_SECRET,
  supabase_url: process.env.SUPABASE_URL,
  supabase_table: process.env.SUPABASE_INSTALLATION_ACCESS_TOKENS_TABLE,
  supabase_key: process.env.SUPABASE_KEY,
  revalidate_first_page: process.env.NEXT_PUBLIC_REVALIDATE_FIRST_PAGE !== 'false',
  origins: JSON.parse(process.env.ORIGINS || '[]') as string[],
  origins_regex: JSON.parse(process.env.ORIGINS_REGEX || '[]') as string[],
  demo_repo: process.env.NEXT_PUBLIC_DEMO_REPO,
  demo_repo_id: process.env.NEXT_PUBLIC_DEMO_REPO_ID,
  demo_category_id: process.env.NEXT_PUBLIC_DEMO_CATEGORY_ID,
} as const;

export const availableThemes = [
  'light',
  'light_high_contrast',
  'light_protanopia',
  'light_tritanopia',
  'dark',
  'dark_high_contrast',
  'dark_protanopia',
  'dark_tritanopia',
  'dark_dimmed',
  'preferred_color_scheme',
  'transparent_dark',
  'noborder_light',
  'noborder_dark',
  'noborder_gray',
  'cobalt',
  'purple_dark',
  'gruvbox',
  'gruvbox_dark',
  'gruvbox_light',
  'catppuccin_latte',
  'catppuccin_frappe',
  'catppuccin_macchiato',
  'catppuccin_mocha',
  'fro',
  'custom',
  'tokyonight_moon',
] as const;

export const meta = {
  title: 'giscus',
  description: 'A comments widget built on GitHub Discussions.',
  image:
    'https://opengraph.githubassets.com/4f866d5b634e7cd5422af77f8dbfb6d48dd288b7c5c18326544c1973210320ed/giscus/giscus',
};

export type AvailableTheme = (typeof availableThemes)[number];

export type Theme = AvailableTheme | `/${string}` | `https://${string}`;
