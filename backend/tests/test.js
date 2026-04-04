const axios = require('axios');

const baseURL = 'http://localhost:5000/api';

const teams = [
  { name: 'Alpha', password: '1234', institution: 'UNI' },
  { name: 'Beta', password: '1234', institution: 'UNI' },
  { name: 'Gamma', password: '1234', institution: 'UNI' },
];

const tokens = [];

const codeAC = '#include<iostream>\nint main() { int a,b; std::cin >> a >> b; std::cout << a+b; return 0; }';
const codeWA = '#include<iostream>\nint main() { int a,b; std::cin >> a >> b; std::cout << a*b; return 0; }';
const codeTLE = '#include<iostream>\nint main() { while(true); return 0; }';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
  console.log('Registering teams...');
  for (const team of teams) {
    try {
      await axios.post(`${baseURL}/auth/register`, team);
    } catch (err) {
      if (err.response?.status !== 409) console.error(err.response?.data || err.message);
    }
  }

  console.log('Logging in teams...');
  for (const team of teams) {
    const res = await axios.post(`${baseURL}/auth/login`, {
      name: team.name,
      password: team.password
    });
    tokens.push(res.data.token);
  }

  console.log('Submitting code...');
  await Promise.all([
    axios.post(`${baseURL}/submissions`, {
      problem_id: 'A',
      language_id: 1,
      contest_id: 1,
      code: codeAC
    }, { headers: { Authorization: `Bearer ${tokens[0]}` } }),

    axios.post(`${baseURL}/submissions`, {
      problem_id: 'A',
      language_id: 2,
      contest_id: 1,
      code: codeWA
    }, { headers: { Authorization: `Bearer ${tokens[1]}` } }),

    axios.post(`${baseURL}/submissions`, {
      problem_id: 'A',
      language_id: 3,
      contest_id: 1,
      code: codeTLE
    }, { headers: { Authorization: `Bearer ${tokens[2]}` } }),
  ]);

  console.log('Waiting for judging to complete...');
  await delay(5000); // Wait for Judge0 processing

  console.log('Fetching leaderboard...');
  const res = await axios.get(`${baseURL}/leaderboard/1`);
  console.log(JSON.stringify(res.data, null, 2));
}

runTest().catch(console.error);
