import { HardwareInfo, DeviceClass } from "@/types/report";

function detectOS(): string {
  if (typeof navigator === "undefined") return "unknown";

  // userAgentData is available in Chromium-based browsers
  const uad = (navigator as { userAgentData?: { platform?: string } }).userAgentData;
  if (uad?.platform) {
    const p = uad.platform.toLowerCase();
    if (p.includes("mac")) return "macos";
    if (p.includes("win")) return "windows";
    if (p.includes("linux")) return "linux";
    if (p.includes("android")) return "android";
    if (p.includes("ios") || p.includes("iphone") || p.includes("ipad")) return "ios";
  }

  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/mac os x/.test(ua)) return "macos";
  if (/windows/.test(ua)) return "windows";
  if (/linux/.test(ua)) return "linux";
  return "unknown";
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "opera";
  if (ua.includes("chrome")) return "chrome";
  if (ua.includes("firefox")) return "firefox";
  if (ua.includes("safari")) return "safari";
  return "unknown";
}

function classifyDevice(vendor: string, device: string, os: string): DeviceClass {
  const v = vendor.toLowerCase();
  const d = device.toLowerCase();

  if (os === "ios" || os === "android") return "mobile";
  if (v.includes("apple") || d.includes("apple")) return "apple-silicon";
  if (v.includes("nvidia") || d.includes("nvidia") || d.includes("geforce") || d.includes("quadro")) return "nvidia";
  if (v.includes("amd") || v.includes("ati") || d.includes("amd") || d.includes("radeon") || d.includes("ati")) return "amd";
  if (v.includes("intel") || d.includes("intel") || v.includes("mesa")) return "intel";
  return "unknown";
}

function backendFromOS(os: string): string {
  if (os === "macos" || os === "ios") return "metal";
  if (os === "windows") return "d3d12";
  if (os === "linux" || os === "android") return "vulkan";
  return "unknown";
}

export async function detectHardware(): Promise<HardwareInfo> {
  const os = detectOS();
  const browser = detectBrowser();
  const cpuThreads = typeof navigator !== "undefined" ? navigator.hardwareConcurrency ?? 0 : 0;

  let gpuVendor = "unknown";
  let gpuDevice = "unknown";

  if (typeof navigator !== "undefined" && "gpu" in navigator) {
    try {
      const gpu = (navigator as { gpu?: { requestAdapter?: () => Promise<unknown> } }).gpu;
      const adapter = await gpu?.requestAdapter?.() as { info?: { vendor?: string; device?: string; description?: string } } | null;
      if (adapter) {
        const info = adapter.info;
        if (info) {
          gpuVendor = info.vendor ?? "unknown";
          gpuDevice = info.description || info.device || "unknown";
        }
      }
    } catch {
      // WebGPU not available or blocked
    }
  }

  const deviceClass = classifyDevice(gpuVendor, gpuDevice, os);
  const webgpuBackend = backendFromOS(os);

  return {
    gpuVendor,
    gpuDevice,
    deviceClass,
    cpuThreads,
    browser,
    os,
    webgpuBackend,
  };
}
