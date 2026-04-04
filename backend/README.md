## Database Schema

### Tables Overview

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `teams` | Team registration and authentication | Unique names, password hashing, institution tracking |
| `contests` | Contest management | Time-bounded events, active status, blind time |
| `problems` | Problem definitions | Rich descriptions, constraints, sample I/O |
| `languages` | Supported programming languages | Language specifications and file extensions |
| `submissions` | Code submissions and results | Verdict tracking, performance metrics |
| `test_cases` | Problem test cases | Input/output pairs, sample case flags |

### Detailed Schema

#### 1. Teams Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique team identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Team name |
| `password` | TEXT | NOT NULL | Hashed password |
| `institution` | VARCHAR(100) | - | Team's institution |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

#### 2. Contests Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique contest identifier |
| `name` | VARCHAR(100) | NOT NULL | Contest name |
| `start_time` | TIMESTAMP | NOT NULL | Contest start time |
| `end_time` | TIMESTAMP | NOT NULL | Contest end time |
| `is_active` | BOOLEAN | DEFAULT TRUE | Contest active status |
| `blind_started_at` | TIMESTAMP | NULL | When public leaderboard freeze starts |

#### 3. Problems Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(10) | PART OF PRIMARY KEY | Problem identifier (e.g., 'A', 'B', 'C') |
| `contest_id` | INT | REFERENCES contests(id) ON DELETE CASCADE, PART OF PRIMARY KEY | Associated contest |
| `title` | VARCHAR(100) | NOT NULL | Problem title |
| `description` | TEXT | - | Problem description |
| `input_description` | TEXT | - | Input format description |
| `output_description` | TEXT | - | Output format description |
| `sample_input` | TEXT | - | Sample input example |
| `sample_output` | TEXT | - | Sample output example |
| `time_limit_ms` | INT | NOT NULL | Time limit in milliseconds |
| `memory_limit_mb` | INT | NOT NULL | Memory limit in megabytes |

#### 4. Languages Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique language identifier |
| `name` | VARCHAR(50) | NOT NULL | Programming language name |
| `extension` | VARCHAR(10) | NOT NULL | File extension |

#### 5. Submissions Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique submission identifier |
| `team_id` | INT | REFERENCES teams(id) ON DELETE CASCADE | Submitting team |
| `contest_id` | INT | REFERENCES contests(id) ON DELETE CASCADE | Associated contest |
| `problem_id` | VARCHAR(10) | PART OF COMPOSITE FK | Problem being solved |
| `language_id` | INT | REFERENCES languages(id) | Programming language used |
| `submitted_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Submission timestamp |
| `code` | TEXT | NOT NULL | Submitted source code |
| `verdict` | VARCHAR(30) | - | Judgment result (ACCEPTED, WRONG_ANSWER, etc.) |
| `execution_time_ms` | INT | - | Execution time in milliseconds |
| `memory_used_kb` | INT | - | Memory usage in kilobytes |

#### 6. Test Cases Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique test case identifier |
| `contest_id` | INT | PART OF COMPOSITE FK | Associated contest |
| `problem_id` | VARCHAR(10) | PART OF COMPOSITE FK | Associated problem |
| `input` | TEXT | NOT NULL | Test case input |
| `expected_output` | TEXT | NOT NULL | Expected output |
| `is_sample` | BOOLEAN | DEFAULT FALSE | Whether it's a sample test case |
