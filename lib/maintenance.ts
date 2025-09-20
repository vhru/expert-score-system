// 简单的维护状态检查
export function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === 'true';
}

export function getMaintenanceMessage(): string {
  return process.env.MAINTENANCE_MESSAGE || '系统正在维护中，预计维护时间：1小时。给您带来的不便敬请谅解。';
}

export function getMaintenanceInfo() {
  if (!isMaintenanceMode()) {
    return null;
  }
  
  return {
    isMaintenance: true,
    message: getMaintenanceMessage(),
    startTime: process.env.MAINTENANCE_START_TIME,
    endTime: process.env.MAINTENANCE_END_TIME
  };
}
