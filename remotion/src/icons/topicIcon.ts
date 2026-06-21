import {
  GitBranch, Box, Zap, Database, Terminal, Lock,
  Cpu, Cloud, Package, Layers, Globe, Search,
  Settings, Lightbulb, Code2, Server, Workflow,
  Bug, Rocket, FileCode, Network, ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const KEYWORD_MAP: Array<[string[], LucideIcon]> = [
  [["git", "commit", "branch", "stash", "merge", "rebase", "diff", "clone"],        GitBranch],
  [["docker", "container", "image", "compose", "kubernetes", "k8s"],                Box],
  [["api", "rest", "graphql", "endpoint", "http", "fetch", "axios", "request"],     Zap],
  [["database", "sql", "postgres", "mysql", "mongo", "redis", "query", "index"],    Database],
  [["terminal", "shell", "bash", "cli", "command", "script", "alias"],              Terminal],
  [["security", "auth", "jwt", "oauth", "ssl", "tls", "encrypt", "password"],       Lock],
  [["performance", "speed", "optimize", "cache", "benchmark", "profil"],            Cpu],
  [["cloud", "aws", "azure", "gcp", "deploy", "lambda", "serverless"],              Cloud],
  [["package", "npm", "pip", "yarn", "pnpm", "install", "dependency"],              Package],
  [["react", "vue", "angular", "component", "hook", "state", "props"],              Layers],
  [["web", "html", "css", "browser", "dom", "frontend"],                            Globe],
  [["server", "backend", "express", "fastapi", "django", "nginx"],                  Server],
  [["workflow", "ci", "cd", "pipeline", "action", "jenkins", "github"],             Workflow],
  [["debug", "bug", "error", "exception", "trace", "log"],                          Bug],
  [["deploy", "release", "ship", "publish", "production"],                          Rocket],
  [["file", "path", "directory", "fs", "read", "write", "stream"],                  FileCode],
  [["network", "socket", "tcp", "udp", "dns", "proxy", "websocket"],                Network],
  [["test", "jest", "pytest", "unit", "integration", "mock", "assert"],             ShieldCheck],
  [["search", "find", "grep", "filter", "query", "index"],                          Search],
  [["config", "settings", "env", "environment", "setup", "dotenv"],                 Settings],
  [["code", "function", "class", "method", "pattern", "algorithm"],                 Code2],
];

export function getTopicIcon(title: string): LucideIcon {
  const lower = title.toLowerCase();
  for (const [keywords, Icon] of KEYWORD_MAP) {
    if (keywords.some((k) => lower.includes(k))) return Icon;
  }
  return Lightbulb;
}
