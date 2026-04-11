import { apiDocsModule } from '../modules/api-docs/config';
import type { SidebarModule } from '../models/sidebar';
import { apiKeysModule } from '../modules/api-keys/config';
import { dashboardsModule } from '../modules/dashboards/config';
import { jobsModule } from '../modules/jobs/config';
import { localAgentModule } from '../modules/local-agent/config';
import { profilesModule } from '../modules/profiles/config';
import { proxiesModule } from '../modules/proxies/config';

export const sidebarModules: SidebarModule[] = [
  dashboardsModule,
  profilesModule,
  proxiesModule,
  jobsModule,
  localAgentModule,
  apiDocsModule,
  apiKeysModule,
];
