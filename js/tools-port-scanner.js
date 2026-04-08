/**
 * Port Scanner Tool - nmap-like functionality
 * Scans for open ports and services
 */

import https from 'https';
import http from 'http';
import net from 'net';

// Common ports and their services
const COMMON_PORTS = {
  21: 'FTP',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  445: 'SMB',
  3306: 'MySQL',
  3389: 'RDP',
  5432: 'PostgreSQL',
  5900: 'VNC',
  6379: 'Redis',
  8080: 'HTTP-ALT',
  8443: 'HTTPS-ALT',
  27017: 'MongoDB',
  9200: 'Elasticsearch'
};

const SCAN_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 27017, 9200];

export async function portScan(host) {
  const results = {
    host: host,
    timestamp: new Date().toISOString(),
    openPorts: [],
    closedPorts: [],
    services: [],
    summary: {}
  };

  console.log(`🔍 Starting port scan on ${host}...`);

  // Scan each port
  for (const port of SCAN_PORTS) {
    try {
      const isOpen = await checkPort(host, port, 5000); // 5 second timeout
      
      if (isOpen) {
        const service = COMMON_PORTS[port] || 'Unknown';
        results.openPorts.push({
          port: port,
          service: service,
          status: 'OPEN',
          timestamp: new Date()
        });
        results.services.push(service);
        console.log(`✓ Port ${port} (${service}) is OPEN`);
      } else {
        results.closedPorts.push({
          port: port,
          status: 'CLOSED'
        });
      }
    } catch (error) {
      results.closedPorts.push({
        port: port,
        status: 'FILTERED',
        error: error.message
      });
    }
  }

  // Generate summary
  results.summary = {
    totalScanned: SCAN_PORTS.length,
    openCount: results.openPorts.length,
    closedCount: results.closedPorts.length,
    riskLevel: results.openPorts.length > 5 ? 'HIGH' : 'LOW',
    services: [...new Set(results.services)]
  };

  return results;
}

function checkPort(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    const onError = () => {
      socket.destroy();
      resolve(false);
    };

    socket.setTimeout(timeout);
    socket.on('timeout', onError);
    socket.on('error', onError);
    
    socket.on('connect', () => {
      socket.end();
      resolve(true);
    });

    socket.connect(port, host);
  });
}

// Analyze services for vulnerabilities
export function analyzeServices(portScanResults) {
  const vulnerabilities = [];

  portScanResults.openPorts.forEach(port => {
    if (port.service === 'Telnet') {
      vulnerabilities.push({
        service: 'Telnet',
        port: port.port,
        severity: 'CRITICAL',
        issue: 'Unencrypted remote access protocol',
        recommendation: 'Disable Telnet, use SSH instead'
      });
    }

    if (port.service === 'FTP') {
      vulnerabilities.push({
        service: 'FTP',
        port: port.port,
        severity: 'HIGH',
        issue: 'Unencrypted file transfer protocol',
        recommendation: 'Use SFTP or FTPS instead'
      });
    }

    if (port.service === 'Redis' || port.service === 'MongoDB') {
      vulnerabilities.push({
        service: port.service,
        port: port.port,
        severity: 'CRITICAL',
        issue: 'Database exposed to network without authentication',
        recommendation: 'Firewall access, enable authentication, use VPN'
      });
    }

    if (port.service === 'MySQL' || port.service === 'PostgreSQL') {
      vulnerabilities.push({
        service: port.service,
        port: port.port,
        severity: 'HIGH',
        issue: 'Database service exposed',
        recommendation: 'Restrict access to localhost, use strong passwords'
      });
    }

    if (port.service === 'SMB') {
      vulnerabilities.push({
        service: 'SMB',
        port: port.port,
        severity: 'HIGH',
        issue: 'Windows file sharing exposed',
        recommendation: 'Disable if not needed, restrict access'
      });
    }
  });

  return vulnerabilities;
}

export function generatePortScanReport(results) {
  let report = `
PORT SCAN REPORT
================
Host: ${results.host}
Scan Date: ${results.timestamp}

SUMMARY:
--------
Total Ports Scanned: ${results.summary.totalScanned}
Open Ports: ${results.summary.openCount}
Closed Ports: ${results.summary.closedCount}
Risk Level: ${results.summary.riskLevel}

OPEN PORTS:
-----------
`;

  results.openPorts.forEach(port => {
    report += `Port ${port.port.toString().padEnd(5)} ${port.service.padEnd(15)} ${port.status}\n`;
  });

  report += `\nDETECTED SERVICES:
------------------
${results.summary.services.join('\n')}

RECOMMENDATIONS:
----------------
${results.openPorts.length > 0 ? `Review ${results.openPorts.length} open port(s) for business necessity` : 'No unnecessary open ports detected'}
Implement firewall rules to restrict access
Close ports not required for operations
Monitor ports for suspicious activity
`;

  return report;
}
