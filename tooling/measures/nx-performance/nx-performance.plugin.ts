import {
  Audit,
  AuditOutputs,
  CategoryRef,
  PluginConfig,
} from '@code-pushup/models';
import { PLUGIN_SLUG } from './constant';
import {
  PROJECT_GRAPH_PERFORMANCE_AUDIT,
  PROJECT_GRAPH_PERFORMANCE_AUDIT_SLUG,
  projectGraphAudit,
  ProjectGraphAuditOptions,
} from './audit/project-graph.audit';
import {
  getTaskTimeAudits,
  ProjectTaskAuditOptions,
  TASK_TIME_AUDIT_POSTFIX,
  taskTimeAudits,
} from './audit/project-task.audit';
import {
  CACHE_SIZE_AUDIT_POSTFIX,
  CacheSizeAuditOptions,
  cacheSizeAudits,
  getCacheSizeAudits,
} from './audit/cache-size.audit';

export const nxPerformanceAudits = ({
  taskTimeTasks,
  cacheSizeTasks,
}: NxPerfPluginConfig) => [
  PROJECT_GRAPH_PERFORMANCE_AUDIT,
  ...(taskTimeTasks ? getTaskTimeAudits(taskTimeTasks) : []),
  ...(cacheSizeTasks ? getCacheSizeAudits(cacheSizeTasks) : []),
];

export const nxPerformanceCategoryRefs = (
  options: NxPerfRunnerOptions
): CategoryRef[] => {
  const allAudits = nxPerformanceAudits(options);
  const audits = options?.onlyAudits
    ? filterOnlyAudits(allAudits, options.onlyAudits)
    : allAudits;
  return audits.map(({ slug }) => ({
    type: 'audit',
    plugin: PLUGIN_SLUG,
    slug,
    weight: 1,
  }));
};

export type OnlyAudit =
  | typeof CACHE_SIZE_AUDIT_POSTFIX
  | typeof PROJECT_GRAPH_PERFORMANCE_AUDIT_SLUG
  | typeof TASK_TIME_AUDIT_POSTFIX;
export type NxPerfPluginConfig = {
  onlyAudits?: OnlyAudit[];
} & ProjectGraphAuditOptions &
  ProjectTaskAuditOptions &
  CacheSizeAuditOptions;

export function nxPerformancePlugin(
  options?: NxPerfPluginConfig
): PluginConfig {
  const allAudits = nxPerformanceAudits(options);
  return {
    slug: PLUGIN_SLUG,
    title: 'Nx Performance Checks',
    icon: 'flash',
    description: 'A plugin to measure and assert performance of Nx workspace.',
    runner: () => runnerFunction(options),
    audits: options?.onlyAudits
      ? filterOnlyAudits(allAudits, options.onlyAudits)
      : allAudits,
  };
}

export default nxPerformancePlugin;

export type NxPerfRunnerOptions = NxPerfPluginConfig;

export function filterOnlyAudits(
  audits: Audit[],
  onlyAudits: OnlyAudit[]
): Audit[] {
  const onlyAuditsSet = new Set(onlyAudits);
  return audits.filter(({ slug }) => {
    if (
      onlyAuditsSet.has(CACHE_SIZE_AUDIT_POSTFIX) &&
      slug.endsWith(CACHE_SIZE_AUDIT_POSTFIX)
    ) {
      return true;
    }
    if (
      onlyAuditsSet.has(TASK_TIME_AUDIT_POSTFIX) &&
      slug.endsWith(TASK_TIME_AUDIT_POSTFIX)
    ) {
      return true;
    }
    return onlyAuditsSet.has(slug as OnlyAudit);
  });
}

export async function runnerFunction(
  options: NxPerfRunnerOptions
): Promise<AuditOutputs> {
  const {
    onlyAudits = [
      PROJECT_GRAPH_PERFORMANCE_AUDIT_SLUG,
      CACHE_SIZE_AUDIT_POSTFIX,
      TASK_TIME_AUDIT_POSTFIX,
    ],
    taskTimeTasks,
    maxTaskTime,
    maxCacheSize,
    cacheSizeTasks,
    maxProjectGraphTime,
  } = options;
  const onlyAuditsSet = new Set(onlyAudits);
  return [
    ...(onlyAuditsSet.has(PROJECT_GRAPH_PERFORMANCE_AUDIT_SLUG)
      ? [await projectGraphAudit({ maxProjectGraphTime })]
      : []),
    ...(onlyAuditsSet.has(CACHE_SIZE_AUDIT_POSTFIX)
      ? await cacheSizeAudits({ maxCacheSize, cacheSizeTasks })
      : []),
    ...(onlyAuditsSet.has(TASK_TIME_AUDIT_POSTFIX)
      ? await taskTimeAudits({ maxTaskTime, taskTimeTasks })
      : []),
  ];
}
