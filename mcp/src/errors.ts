export type ErrorCode =
  | "INVALID_NAME"
  | "NOT_FOUND"
  | "GITHUB_TIMEOUT"
  | "GITHUB_RATE_LIMITED"
  | "GITHUB_UNREACHABLE"
  | "RESPONSE_TOO_LARGE"
  | "INVALID_SOURCE_REF"
  | "INTERNAL_ERROR";

const RETRYABLE_CODES: ReadonlySet<ErrorCode> = new Set([
  "GITHUB_TIMEOUT",
  "GITHUB_RATE_LIMITED",
  "GITHUB_UNREACHABLE",
]);

export interface WorkflowErrorOptions {
  retryable?: boolean;
  details?: unknown;
}

/**
 * The one shared error shape for this server. Every tool handler catches its own errors and
 * converts them (via toToolErrorResult) into this shape rather than letting an exception escape
 * unhandled and crash the process.
 */
export class WorkflowError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, options: WorkflowErrorOptions = {}) {
    super(message);
    this.name = "WorkflowError";
    this.code = code;
    this.retryable = options.retryable ?? RETRYABLE_CODES.has(code);
    this.details = options.details;
  }
}

export interface ErrorPayload {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  details?: unknown;
}

export function toErrorPayload(error: unknown): ErrorPayload {
  if (error instanceof WorkflowError) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      details: error.details,
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    code: "INTERNAL_ERROR",
    message,
    retryable: false,
  };
}

export interface ToolErrorResult {
  [x: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError: true;
}

/**
 * Converts any thrown value into an MCP tool error result. Never throws itself, so it is safe to
 * call from a top-level catch in every tool handler.
 */
export function toToolErrorResult(error: unknown): ToolErrorResult {
  const payload = toErrorPayload(error);
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    isError: true,
  };
}
