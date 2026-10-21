/**
 * Video URL Security & Server-Side Request Forgery (SSRF) Validator.
 * Protects against internal network probing, localhost access, cloud metadata endpoints,
 * and unsafe redirect schemes.
 */

import { SecurityValidationResult } from './types';

// Allowed schemes
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

// Blocked hostnames
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',
  'instance-data',
]);

// Blocked domain suffixes
const BLOCKED_DOMAIN_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.lan',
  '.corp',
  '.home',
  '.test',
  '.example',
  '.invalid',
];

/**
 * Checks if an IPv4 address string falls into a private/reserved subnet.
 */
export function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) {
    return false;
  }

  const [a, b, c, d] = parts;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 0.0.0.0/8 (Current network / default)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private class A)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private class B: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private class C)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-local / AWS & GCP cloud instance metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 224.0.0.0/4 (Multicast: 224.0.0.0 - 239.255.255.255)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future use)
  if (a >= 240) return true;

  // 255.255.255.255 (Broadcast)
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

/**
 * Checks if an IPv6 address falls into private or loopback ranges.
 */
export function isPrivateIpv6(rawHost: string): boolean {
  const host = rawHost.replace(/^\[|\]$/g, '').toLowerCase();

  // ::1 (Loopback)
  if (host === '::1' || host === '0:0:0:0:0:0:0:1') return true;

  // :: (Unspecified)
  if (host === '::' || host === '0:0:0:0:0:0:0:0') return true;

  // fe80::/10 (Link-local)
  if (host.startsWith('fe80:') || host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb')) {
    return true;
  }

  // fc00::/7 (Unique local addresses fc00:: - fdff::)
  if (host.startsWith('fc') || host.startsWith('fd')) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:10.0.0.1)
  if (host.startsWith('::ffff:')) {
    const ipv4 = host.replace('::ffff:', '');
    return isPrivateIpv4(ipv4);
  }

  return false;
}

/**
 * Validates a video URL against SSRF vulnerabilities, illegal schemes, and malformed structures.
 */
export function validateUrlSecurity(rawUrl: string): SecurityValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'Please enter a valid video link.' };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length < 8) {
    return { isValid: false, error: 'The provided URL is too short to be valid.' };
  }

  // Maximum allowed URL length to avoid regex ReDoS or memory issues
  if (trimmed.length > 2048) {
    return { isValid: false, error: 'The provided URL exceeds the maximum length limit of 2,048 characters.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Malformed URL. Please include the full http:// or https:// address.' };
  }

  // 1. Protocol Check (Must be HTTP or HTTPS)
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      isValid: false,
      error: `Unsupported protocol "${parsed.protocol}". Only secure web links (https:// or http://) are permitted.`,
      protocol: parsed.protocol,
    };
  }

  // 2. Reject embedded user credentials (e.g. http://admin:pass@example.com)
  if (parsed.username || parsed.password) {
    return {
      isValid: false,
      error: 'URLs containing embedded usernames or passwords are not permitted for security.',
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 3. Reject empty hostname
  if (!hostname || hostname.length === 0) {
    return { isValid: false, error: 'The video URL does not contain a valid hostname.' };
  }

  // 4. Direct hostname blocklist
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return {
      isValid: false,
      error: `Access to "${hostname}" is restricted for security (SSRF protection).`,
      hostname,
      isPrivateIp: true,
    };
  }

  // 5. Block internal domain suffixes (.local, .internal, etc.)
  for (const suffix of BLOCKED_DOMAIN_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return {
        isValid: false,
        error: `Internal domain address "${hostname}" is not accessible.`,
        hostname,
        isPrivateIp: true,
      };
    }
  }

  // 6. Check for numeric IPv4 addresses
  const isIpv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (isIpv4Regex.test(hostname)) {
    if (isPrivateIpv4(hostname)) {
      return {
        isValid: false,
        error: `IP address "${hostname}" is in a private or restricted network range.`,
        hostname,
        isPrivateIp: true,
      };
    }
  }

  // 7. Check for IPv6 addresses
  if (hostname.startsWith('[') || hostname.includes(':')) {
    if (isPrivateIpv6(hostname)) {
      return {
        isValid: false,
        error: `IPv6 address "${hostname}" is in a private or loopback network range.`,
        hostname,
        isPrivateIp: true,
      };
    }
  }

  // 8. Custom ports restriction (allow standard web ports 80, 443, 8080, 8443, or default)
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    const ALLOWED_PORTS = new Set([80, 443, 8080, 8443]);
    if (!ALLOWED_PORTS.has(portNum)) {
      return {
        isValid: false,
        error: `Custom network port ${portNum} is restricted. Only standard web ports (80, 443) are allowed.`,
      };
    }
  }

  return {
    isValid: true,
    normalizedUrl: parsed.toString(),
    hostname,
    protocol: parsed.protocol,
  };
}
