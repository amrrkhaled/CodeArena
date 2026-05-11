const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const red    = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;
const dim    = (s) => `\x1b[2m${s}\x1b[0m`;

class MinimalReporter {
  onTestResult(test, { testResults }) {
    const file = test.path.replace(process.cwd() + '/', '');
    console.log(`\n${bold(file)}`);
    testResults.forEach(({ status, fullName }) => {
      if (status === 'passed') {
        console.log(`  ${green('✔')} ${dim(fullName)}`);
      } else {
        console.log(`  ${red('✘')} ${red(fullName)}`);
      }
    });
  }

  onRunComplete(_, { numPassedTests, numFailedTests, numTotalTests }) {
    const line = '─'.repeat(40);
    console.log(`\n${dim(line)}`);
    console.log(`  ${bold('Total')}   ${numTotalTests}`);
    console.log(`  ${green('Passed')}  ${green(numPassedTests)}`);
    if (numFailedTests > 0) {
      console.log(`  ${red('Failed')}  ${red(numFailedTests)}`);
    }
    console.log(dim(line));
  }
}

module.exports = MinimalReporter;
