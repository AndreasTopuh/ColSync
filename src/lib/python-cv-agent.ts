import { spawn } from 'node:child_process';
import path from 'node:path';

export interface PythonUploadedDoc {
  name: string;
  mimeType: string;
  base64: string;
}

export interface PythonCVPipelineInput {
  cvText?: string;
  jobDescription: string;
  uploadedDoc?: PythonUploadedDoc;
}

interface PythonCVPipelineResult {
  source?: string;
  cvText?: string;
  jobDescription?: string;
  summary?: Record<string, unknown>;
  audit?: Record<string, unknown>;
}

interface PythonResponse {
  ok: boolean;
  result?: PythonCVPipelineResult;
  meta?: {
    providerTrace?: Array<Record<string, unknown>>;
  };
  error?: string;
}

export interface PythonPipelineMeta {
  providerTrace: Array<Record<string, unknown>>;
}

export interface PythonCVPipelineOutput {
  result: PythonCVPipelineResult;
  meta: PythonPipelineMeta;
}

function runProcess(command: string, args: string[], stdin: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let finished = false;

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill('SIGKILL');
      reject(new Error(`Python process timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);

      if (code === 0 || stdout.trim().startsWith('{')) {
        resolve(stdout.trim());
        return;
      }

      reject(new Error(`Python exited with code ${code}. ${stderr || stdout}`));
    });

    child.stdin.write(stdin);
    child.stdin.end();
  });
}

async function runPythonPipeline(input: PythonCVPipelineInput): Promise<PythonCVPipelineOutput> {
  const runner = path.join(process.cwd(), 'src', 'lib', 'agents', 'run_cv_pipeline.py');
  const stdin = JSON.stringify(input);
  const timeoutMs = 120000;

  const candidates = [
    process.env.PYTHON_EXECUTABLE,
    'python',
    'py',
  ].filter(Boolean) as string[];

  const errors: string[] = [];

  for (const cmd of candidates) {
    const args = cmd === 'py' ? ['-3', runner] : [runner];

    try {
      const raw = await runProcess(cmd, args, stdin, timeoutMs);
      const parsed = JSON.parse(raw) as PythonResponse;

      if (!parsed.ok) {
        throw new Error(parsed.error || 'Python pipeline returned ok=false');
      }

      if (!parsed.result?.audit) {
        throw new Error('Python pipeline returned no audit payload');
      }

      return {
        result: parsed.result,
        meta: {
          providerTrace: parsed.meta?.providerTrace ?? [],
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${cmd}: ${message}`);
    }
  }

  throw new Error(`Failed to run Python CV pipeline. ${errors.join(' | ')}`);
}

export async function runPythonCVPipeline(input: PythonCVPipelineInput): Promise<PythonCVPipelineOutput> {
  return runPythonPipeline(input);
}
