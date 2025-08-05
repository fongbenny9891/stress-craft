export const config = {
  detectors: {
    node: {
      url: process.env.NODE_DETECTOR_URL || 'http://localhost:3000',
      defaultCount: 100,
      defaultSize: 100,
    },
    go: {
      url: process.env.GO_DETECTOR_URL || 'http://localhost:3001',
      defaultCount: 100,
      defaultSize: 100,
    }
  },
  routes: {
    hostInfo: '/host-info',
    writeTest: '/write-test',
    writeStatus: '/write-status'
  }
} as const;