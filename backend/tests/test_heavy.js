/**
 * test_heavy.js
 * 
 * A comprehensive, end-to-end stress & functionality test for your contest system.
 * 
 * - Registers seed teams (skips if already present)
 * - Logs them in, stores tokens
 * - Fetches contest + problems + languages
 * - Submits code for multiple scenarios (AC, WA, TLE) across teams
 * - Polls verdicts, prints summaries, prints leaderboard
 * 
 * This script is intentionally verbose and long so you can tweak parts easily.
 * It matches your backend endpoints and payloads precisely:
 *   POST /auth/register
 *   POST /auth/login
 *   GET  /contests/:id
 *   GET  /languages
 *   GET  /problems/:contestId
 *   POST /submissions            { contest_id, problem_id, language_id, code }
 *   GET  /submissions/my?contest_id=...
 *   GET  /submissions/:id        (team-scope)
 *   GET  /leaderboard/:contestId
 */

const axios = require('axios');

// ======================= CONFIG =======================

const baseURL = 'http://localhost:5000/api';
const contestId = 2; // <- Your seeded contest id

// Seed teams
const teams = [
  { name: 'Alpha',   password: '1234', institution: 'UNI' },
  { name: 'Beta',    password: '1234', institution: 'UNI' },
  { name: 'Gamma',   password: '1234', institution: 'UNI' },
  { name: 'Delta',   password: '1234', institution: 'UNI' },
  { name: 'Epsilon', password: '1234', institution: 'UNI' },
];

// Concurrency: how many submissions in flight at once (per Promise.all)
const SUBMIT_CONCURRENCY_BUCKET = 20;

// Polling params
const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS  = 45_000;

// ============== LOGGING HELPERS (pretty output) ==============

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function logInfo(...args) {
  console.log(C.cyan + 'ℹ️', ...args, C.reset);
}

function logOk(...args) {
  console.log(C.green + '✅', ...args, C.reset);
}

function logWarn(...args) {
  console.log(C.yellow + '⚠️', ...args, C.reset);
}

function logErr(...args) {
  console.log(C.red + '❌', ...args, C.reset);
}

function hr(title = '') {
  const line = '─'.repeat(40);
  if (title) console.log(C.gray + `\n${line} ${title} ${line}\n` + C.reset);
  else console.log(C.gray + `\n${line.repeat(2)}\n` + C.reset);
}

// ======================= UTILITIES =======================

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Axios instance (you can add interceptors if you want pretty timings)
const api = axios.create({
  baseURL,
  timeout: 30_000,
});

// Safety wrapper for requests with retry (basic)
async function withRetry(fn, label = 'request', retries = 2, delayMs = 600) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      const data   = err.response?.data;
      if (i < retries) {
        logWarn(`${label} failed (attempt ${i + 1}/${retries + 1})`, status ? `status=${status}` : '', data ? `data=${JSON.stringify(data)}` : '', '— retrying...');
        await sleep(delayMs);
      } else {
        logErr(`${label} failed after ${retries + 1} attempts`, status ? `status=${status}` : '', data ? `data=${JSON.stringify(data)}` : '', err.message);
      }
    }
  }
  throw lastErr;
}

// Simple tabular print
function printTable(rows, headers) {
  if (!rows || rows.length === 0) {
    console.log(C.dim + '(no rows)' + C.reset);
    return;
  }
  const cols = headers || Object.keys(rows[0]);
  const widths = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] ?? '').length)));
  const sep = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';

  console.log(sep);
  console.log('|' + cols.map((c, i) => ' ' + c.padEnd(widths[i]) + ' ').join('|') + '|');
  console.log(sep);
  for (const r of rows) {
    console.log('|' + cols.map((c, i) => ' ' + String(r[c] ?? '').padEnd(widths[i]) + ' ').join('|') + '|');
  }
  console.log(sep);
}

// ======================= TEST CODE SNIPPETS =======================

const codeSnippets = {
  // C++ snippets
  cpp: {
    sumAC: '#include<iostream>\nint main(){int a,b;std::cin>>a>>b;std::cout<<a+b;return 0;}',
    sumWA: '#include<iostream>\nint main(){int a,b;std::cin>>a>>b;std::cout<<a*b;return 0;}',
    sumTLE: '#include<iostream>\nint main(){while(true){}return 0;}',

    palindromeAC:
`#include <bits/stdc++.h>
using namespace std;
int main(){string s; if(!(cin>>s)) return 0; string t=s; reverse(t.begin(),t.end()); cout<<(s==t?"YES":"NO"); return 0;}`,
    palindromeWA: '#include<iostream>\nint main(){std::cout<<"NO";return 0;}',

    maxAC:
`#include <bits/stdc++.h>
using namespace std;
int main(){int n; if(!(cin>>n)) return 0; int m=-2000000000; for(int i=0;i<n;i++){int x;cin>>x;m=max(m,x);} cout<<m; return 0;}`,
    maxWA:
`#include <bits/stdc++.h>
using namespace std;
int main(){int n; if(!(cin>>n)) return 0; long long s=0; for(int i=0;i<n;i++){int x;cin>>x;s+=x;} cout<<s; return 0;}`,
  },

  // Python snippets
  python: {
    sumAC: 'a,b=map(int,input().split());print(a+b)',
    sumWA: 'a,b=map(int,input().split());print(a-b)',
  },

  // Java snippets
  java: {
    sumAC:
`import java.util.*;
public class Main{
  public static void main(String[] args){
    Scanner sc=new Scanner(System.in);
    int a=sc.nextInt(), b=sc.nextInt();
    System.out.println(a+b);
  }
}`,
  }
};

// ======================= API WRAPPERS =======================

async function registerTeam({ name, password, institution }) {
  return withRetry(
    () => api.post('/auth/register', { name, password, institution }),
    `register ${name}`
  );
}

async function loginTeam({ name, password }) {
  return withRetry(
    () => api.post('/auth/login', { name, password }),
    `login ${name}`
  );
}

async function getContest(id) {
  return withRetry(
    () => api.get(`/contests/${id}`),
    `get contest ${id}`
  );
}

async function getLanguages() {
  return withRetry(
    () => api.get('/languages'),
    'get languages'
  );
}

async function getProblemsForContest(contestId) {
  return withRetry(
    () => api.get(`/problems/${contestId}`),
    `get problems for contest ${contestId}`
  );
}

async function submitSolution(token, { contest_id, problem_id, language_id, code }) {
  return withRetry(
    () => api.post('/submissions',
      { contest_id, problem_id, language_id, code },
      { headers: { Authorization: `Bearer ${token}` } }
    ),
    `submit p${problem_id} (lang ${language_id})`
  );
}

async function getMySubmissions(token, contest_id) {
  return withRetry(
    () => api.get(`/submissions/my`, {
      params: { contest_id },
      headers: { Authorization: `Bearer ${token}` }
    }),
    'get my submissions'
  );
}

async function getSubmissionById(token, id) {
  return withRetry(
    () => api.get(`/submissions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    `get submission ${id}`
  );
}

async function getLeaderboard(contestId) {
  return withRetry(
    () => api.get(`/leaderboard/${contestId}`),
    `get leaderboard ${contestId}`
  );
}

// ======================= LANGUAGE RESOLUTION =======================

/**
 * Try to resolve language ids from /languages.
 * Fallback to conventional ids if not found (cpp=1, python=2, java=3).
 */
async function resolveLanguageIds() {
  const fallback = { cpp: 1, python: 2, java: 3 };
  try {
    const { data } = await getLanguages();
    if (!Array.isArray(data) || data.length === 0) {
      logWarn('Languages list is empty; using fallbacks', fallback);
      return fallback;
    }

    // Try to match by typical fields (name, slug, id)
    const map = {};
    for (const row of data) {
      const name = String(row.name || row.slug || '').toLowerCase();

      // Heuristics
      if (!map.cpp && /c\+\+|cpp|gcc/.test(name)) map.cpp = row.id;
      if (!map.python && /python/.test(name)) map.python = row.id;
      if (!map.java && /\bjava\b/.test(name)) map.java = row.id;
    }

    const resolved = {
      cpp: map.cpp ?? fallback.cpp,
      python: map.python ?? fallback.python,
      java: map.java ?? fallback.java,
    };

    logOk('Resolved language ids:', resolved);
    return resolved;
  } catch (e) {
    logWarn('Failed to resolve language ids; using fallbacks', fallback);
    return fallback;
  }
}

// ======================= SUBMISSION PLAN =======================

/**
 * Build a submission plan per team, based on discovered problems.
 * We’ll try to map typical problems by small heuristics:
 *  - A: sum of two numbers
 *  - B: palindrome check
 *  - C: max in array
 * If names don't match, we still submit to the first 3 problems deterministically.
 */
function buildSubmissionPlan(problems, languagesIds) {
  // Sort by id for determinism
  const sorted = [...problems].sort((a, b) => a.id - b.id);

  // Heuristic mapping by title/description
  function detectProblemId(keyword) {
    const idx = sorted.find(p => {
      const h = (p.title + ' ' + (p.description || '')).toLowerCase();
      return h.includes(keyword);
    });
    return idx ? idx.id : null;
  }

  const mapGuess = {
    A: detectProblemId('sum') || (sorted[0]?.id ?? null),
    B: detectProblemId('palindrome') || (sorted[1]?.id ?? null),
    C: detectProblemId('max') || (sorted[2]?.id ?? null),
  };

  const compact = Object.entries(mapGuess).filter(([, v]) => v != null);
  if (compact.length < 3 && sorted.length >= 3) {
    // Fill missing with remaining first 3 unique ids
    const chosen = new Set(compact.map(([, v]) => v));
    for (const p of sorted) {
      if (chosen.size >= 3) break;
      if (!chosen.has(p.id)) chosen.add(p.id);
    }
    const arr = [...chosen];
    mapGuess.A = arr[0] ?? mapGuess.A;
    mapGuess.B = arr[1] ?? mapGuess.B;
    mapGuess.C = arr[2] ?? mapGuess.C;
  }

  const problemsSelected = {
    A: mapGuess.A,
    B: mapGuess.B,
    C: mapGuess.C,
  };

  logOk('Planned problem ids:', problemsSelected);

  // For each team, define an array of intended submissions (description + payload builder)
  const plans = {
    Alpha: [
      {
        label: 'Alpha - A (AC, C++)',
        build: () => ({
          contest_id: contestId,
          problem_id: problemsSelected.A,
          language_id: languagesIds.cpp,
          code: codeSnippets.cpp.sumAC
        })
      },
      {
        label: 'Alpha - B (AC, C++)',
        build: () => ({
          contest_id: contestId,
          problem_id: problemsSelected.B,
          language_id: languagesIds.cpp,
          code: codeSnippets.cpp.palindromeAC
        })
      },
      {
        label: 'Alpha - C (AC, C++)',
        build: () => ({
          contest_id: contestId,
          problem_id: problemsSelected.C,
          language_id: languagesIds.cpp,
          code: codeSnippets.cpp.maxAC
        })
      },
    ],
    Beta: [
      {
        label: 'Beta - A (AC, Python)',
        build: () => ({
          contest_id: contestId,
          problem_id: problemsSelected.A,
          language_id: languagesIds.python,
          code: codeSnippets.python.sumAC
        })
      },
      {
        label: 'Beta - B (WA, C++)',
        build: () => ({
          contest_id: contestId,
          problem_id: problemsSelected.B,
          language_id: languagesIds.cpp,
          code: codeSnippets.cpp.palindromeWA
        })
      },
      {
        label: 'Beta - A (WA retry, C++)',
        build: () => ({
          contest_id: contestId,
          problem_id: problemsSelected.A,
          language_id: languagesIds.cpp,
          code: codeSnippets.cpp.sumWA
        })
      },
    ],
    Gamma: [
      {
        label: 'Gamma - A (TLE, C++)',
        build: () => ({
          contest_id: contestId,
          problem_id: problemsSelected.A,
          language_id: languagesIds.cpp,
          code: codeSnippets.cpp.sumTLE
        })
      },
      {
        label: 'Gamma - C (WA, C++)',
        build: () => ({
          contest_id: contestId,
          problem_id: problemsSelected.C,
          language_id: languagesIds.cpp,
          code: codeSnippets.cpp.maxWA
        })
      },
    ],
    Delta: [
      {
        label: 'Delta - A (WA, Python)',
        build: () => ({
          contest_id: contestId,
          problem_id: problemsSelected.A,
          language_id: languagesIds.python,
          code: codeSnippets.python.sumWA
        })
      },
      {
        label: 'Delta - A (AC retry, Python)',
        build: () => ({
          contest_id: contestId,
          problem_id: problemsSelected.A,
          language_id: languagesIds.python,
          code: codeSnippets.python.sumAC
        })
      },
    ],
    Epsilon: [
      {
        label: 'Epsilon - A (AC, Java)',
        build: () => ({
          contest_id: contestId,
          problem_id: problemsSelected.A,
          language_id: languagesIds.java,
          code: codeSnippets.java.sumAC
        })
      },
    ]
  };

  return { problemsSelected, plans };
}

// ======================= POLLING =======================

function isFinalVerdict(v) {
  if (!v) return false;
  const s = String(v).toLowerCase();
  // You can extend with more statuses if your judge uses others
  return ['accepted', 'wrong answer', 'time limit exceeded', 'tle', 'runtime error', 'compilation error', 'memory limit exceeded'].includes(s);
}

async function pollSubmissionUntilFinal(token, submissionId, label) {
  const started = Date.now();
  while (Date.now() - started < POLL_TIMEOUT_MS) {
    const { data } = await getSubmissionById(token, submissionId);
    const v = data.verdict;
    if (isFinalVerdict(v)) {
      logOk(`${label} — FINAL verdict: ${C.bold}${v}${C.reset}`);
      return { id: submissionId, verdict: v, time_ms: data.execution_time_ms ?? null, problem_id: data.problem_id };
    }
    logInfo(`${label} — pending verdict: ${v ?? 'Pending'}`);
    await sleep(POLL_INTERVAL_MS);
  }
  logWarn(`${label} — timed out waiting for final verdict`);
  return { id: submissionId, verdict: 'Pending/Timeout', time_ms: null, problem_id: null };
}

// ======================= MAIN FLOW =======================

async function main() {
  hr('START');
  logInfo('Base URL:', baseURL);
  logInfo('Contest ID:', contestId);

  // 1) Contest check
  hr('CONTEST');
  const { data: contest } = await getContest(contestId);
  logOk(`Contest: ${contest.name} (id=${contest.id}) Active=${contest.is_active ?? 'unknown'}`);

  // 2) Languages resolve
  hr('LANGUAGES');
  const languageIds = await resolveLanguageIds();

  // 3) Problems fetch
  hr('PROBLEMS');
  const { data: problems } = await getProblemsForContest(contestId);
  if (!Array.isArray(problems) || problems.length === 0) {
    throw new Error('No problems found for the contest. Seed your DB first.');
  }
  logOk(`Found ${problems.length} problems in contest ${contestId}`);
  printTable(
    problems.map(p => ({
      id: p.id,
      title: p.title,
      tl_ms: p.time_limit_ms,
      ml_mb: p.memory_limit_mb
    })),
    ['id', 'title', 'tl_ms', 'ml_mb']
  );

  // 4) Register or login teams
  hr('TEAMS: REGISTER');
  const tokens = [];
  for (const t of teams) {
    try {
      await registerTeam(t);
      logOk(`Registered team ${t.name}`);
    } catch (err) {
      if (err?.response?.status === 409) {
        logWarn(`Team ${t.name} already exists, continuing`);
      } else {
        logWarn(`Register ${t.name} failed, attempting to continue:`, err.message);
      }
    }
  }

  hr('TEAMS: LOGIN');
  for (const t of teams) {
    try {
      const { data } = await loginTeam({ name: t.name, password: t.password });
      tokens.push({ name: t.name, token: data.token });
      logOk(`Logged in ${t.name}`);
    } catch (err) {
      logErr(`Login failed for ${t.name}`, err.response?.data || err.message);
      tokens.push({ name: t.name, token: null });
    }
  }

  // 5) Build submission plan
  hr('PLAN');
  const { problemsSelected, plans } = buildSubmissionPlan(problems, languageIds);
  logInfo('Submission mapping (A/B/C -> problem ids):', problemsSelected);

  // 6) Fire submissions concurrently
  hr('SUBMISSIONS: SEND');
  const submissionRecords = []; // { team, label, id, planned: {...} }

  async function fireTeamPlan(teamName, token) {
    const plan = plans[teamName];
    if (!plan || !token) return;

    const chunks = [];
    // chunking for potential throttle; here we just push all once
    chunks.push(plan);

    for (const arr of chunks) {
      const tasks = arr.map(async (step) => {
        const payload = step.build();
        try {
          const { data } = await submitSolution(token, payload);
          const sid = data.submissionId;
          logOk(`${teamName}: ${step.label} — submitted (id=${sid})`);
          submissionRecords.push({
            team: teamName,
            label: step.label,
            id: sid,
            planned: payload
          });
        } catch (err) {
          logErr(`${teamName}: ${step.label} — submit failed`, err.response?.data || err.message);
        }
      });

      // throttle/concurrency bucket if desired
      for (let i = 0; i < tasks.length; i += SUBMIT_CONCURRENCY_BUCKET) {
        await Promise.all(tasks.slice(i, i + SUBMIT_CONCURRENCY_BUCKET));
      }
    }
  }

  for (const { name, token } of tokens) {
    await fireTeamPlan(name, token);
  }

  logOk(`Total submissions fired: ${submissionRecords.length}`);

  // 7) Poll results for each team’s submissions
  hr('POLLING: VERDICTS');
  const verdicts = [];

  // Poll per submission by owner token
  for (const team of tokens) {
    if (!team.token) continue;
    const mine = submissionRecords.filter(r => r.team === team.name);
    for (const rec of mine) {
      const result = await pollSubmissionUntilFinal(team.token, rec.id, `${team.name}: ${rec.label}`);
      verdicts.push({ ...result, team: team.name, label: rec.label });
    }
  }

  // 8) Print per-team summary table
  hr('SUMMARY: PER-TEAM');
  const summary = {};
  for (const v of verdicts) {
    if (!summary[v.team]) summary[v.team] = { team: v.team, total: 0, AC: 0, WA: 0, TLE: 0, CE: 0, RE: 0, PENDING: 0 };
    summary[v.team].total++;
    const verdict = String(v.verdict || '').toLowerCase();
    if (verdict === 'accepted') summary[v.team].AC++;
    else if (verdict === 'wrong answer') summary[v.team].WA++;
    else if (verdict === 'time limit exceeded' || verdict === 'tle') summary[v.team].TLE++;
    else if (verdict === 'compilation error') summary[v.team].CE++;
    else if (verdict === 'runtime error') summary[v.team].RE++;
    else summary[v.team].PENDING++;
  }
  printTable(Object.values(summary).sort((a, b) => a.team.localeCompare(b.team)));

  // 9) Cross-check with /submissions/my (sanity)
  hr('CROSS-CHECK: /submissions/my');
  for (const team of tokens) {
    if (!team.token) continue;
    try {
      const { data } = await getMySubmissions(team.token, contestId);
      const latest = (data || []).slice(0, 5).map(s => ({
        id: s.id,
        problem_id: s.problem_id,
        verdict: s.verdict,
        at: s.submitted_at
      }));
      logOk(`${team.name} — last ${latest.length} submissions:`);
      printTable(latest, ['id', 'problem_id', 'verdict', 'at']);
    } catch (err) {
      logErr(`Failed fetching my submissions for ${team.name}`, err.response?.data || err.message);
    }
  }

  // 10) Leaderboard
  hr('LEADERBOARD');
  try {
    const { data: lb } = await getLeaderboard(contestId);
    if (!lb || lb.length === 0) {
      logWarn('Leaderboard is empty (no accepted submissions or scoring rules filtered them out).');
    } else {
      printTable(lb.map((r, i) => ({
        rank: i + 1,
        team: r.team_name,
        solved: r.solved_count,
        penalty: r.total_penalty
      })), ['rank', 'team', 'solved', 'penalty']);
    }
  } catch (err) {
    logErr('Failed to fetch leaderboard', err.response?.data || err.message);
  }

  // 11) Final per-submission log (compact)
  hr('FINAL SUBMISSION LOG');
  const finalLog = verdicts
    .sort((a, b) => a.team.localeCompare(b.team) || a.id - b.id)
    .map(v => ({
      team: v.team,
      id: v.id,
      verdict: v.verdict,
      problem_id: v.problem_id,
      exec_ms: v.time_ms ?? ''
    }));
  printTable(finalLog, ['team', 'id', 'problem_id', 'verdict', 'exec_ms']);

  hr('DONE');
}

// ======================= RUN =======================

main().catch(err => {
  logErr('Fatal error in test runner:', err.response?.data || err.message);
  process.exit(1);
});
