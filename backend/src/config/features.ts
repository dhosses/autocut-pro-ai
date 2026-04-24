export type Tier = "free" | "basic" | "pro";

export interface Features {
  silenceTrim: boolean;
  aiSubtitles: boolean;
  multiCamSync: boolean;
  subjectTracking: boolean;
  fcpxmlExport: boolean;
  srtExport: boolean;
  mp4Export: boolean;
  priorityQueue: boolean;
  earlyAccess: boolean;
  downloadInstaller: boolean;
  processingMinutes: number | null; // null = unlimited
}

export const FEATURE_FLAGS: Record<Tier, Features> = {
  free: {
    silenceTrim: true,
    aiSubtitles: true,
    multiCamSync: true,
    subjectTracking: true,
    fcpxmlExport: true,
    srtExport: true,
    mp4Export: false,
    priorityQueue: false,
    earlyAccess: false,
    downloadInstaller: false,
    processingMinutes: 30,
  },
  basic: {
    silenceTrim: true,
    aiSubtitles: true,
    multiCamSync: true,
    subjectTracking: true,
    fcpxmlExport: true,
    srtExport: true,
    mp4Export: true,
    priorityQueue: false,
    earlyAccess: false,
    downloadInstaller: true,
    processingMinutes: 200,
  },
  pro: {
    silenceTrim: true,
    aiSubtitles: true,
    multiCamSync: true,
    subjectTracking: true,
    fcpxmlExport: true,
    srtExport: true,
    mp4Export: true,
    priorityQueue: true,
    earlyAccess: true,
    downloadInstaller: true,
    processingMinutes: null,
  },
};
