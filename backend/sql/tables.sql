-- Drop in reverse dependency order
DROP TABLE IF EXISTS test_cases   CASCADE;
DROP TABLE IF EXISTS submissions  CASCADE;
DROP TABLE IF EXISTS problems     CASCADE;
DROP TABLE IF EXISTS languages    CASCADE;
DROP TABLE IF EXISTS contests     CASCADE;
DROP TABLE IF EXISTS teams        CASCADE;
DROP TABLE IF EXISTS admins       CASCADE;

-- 1. Teams
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    institution VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Contests
CREATE TABLE contests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    blind_started_at TIMESTAMP NULL,
    CONSTRAINT contests_status_check CHECK (status IN ('DRAFT','UPCOMING','ACTIVE','FROZEN','FINISHED'))
);

-- 3. Problems
CREATE TABLE problems (
    id VARCHAR(10),
    contest_id INT REFERENCES contests(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    input_description TEXT,
    output_description TEXT,
    sample_input TEXT,
    sample_output TEXT,
    time_limit_ms INT NOT NULL,
    memory_limit_mb INT NOT NULL,
    PRIMARY KEY (contest_id, id)
);

-- 4. Languages
CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    extension VARCHAR(10) NOT NULL
);

-- 5. Submissions
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    contest_id INT REFERENCES contests(id) ON DELETE CASCADE,
    problem_id VARCHAR(10),
    language_id INT REFERENCES languages(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    code TEXT NOT NULL,
    verdict VARCHAR(30),
    execution_time_ms INT,
    memory_used_kb INT,
    FOREIGN KEY (contest_id, problem_id)
      REFERENCES problems(contest_id, id)
      ON DELETE CASCADE
);

-- 6. Test Cases
CREATE TABLE test_cases (
  id SERIAL PRIMARY KEY,
  contest_id INT,
  problem_id VARCHAR(10),
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample BOOLEAN DEFAULT false,
  FOREIGN KEY (contest_id, problem_id)
    REFERENCES problems(contest_id, id)
    ON DELETE CASCADE
);

-- 7. Admins
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
