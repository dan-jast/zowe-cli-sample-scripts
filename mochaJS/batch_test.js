var assert = require('assert');
var cmd = require('node-cmd');
/**
 * Sleep function.
 * @param {number} ms Number of ms to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
* Polls jobId. Returns true if job completes with CC 0000 in the allotted time
* @param {string}   jobId     jobId to check the completion of
* @param {function} callback  function to call after completion
* @param {number}   tries     max attempts to check the completion of the job
* @param {number}   wait      wait time in ms between each check
* 
* @returns {boolean} true if the job successfully completes, otherwise false
*/
function awaitJobCompletion(jobId, callback, tries = 10, wait = 1000) {
  if (tries > 0) {
      sleep(wait);
      cmd.get(
      'bright jobs view job-status-by-jobid ' + jobId + ' --rff retcode --rft string',
      function (err, data, stderr) {
          retcode = data.trim();
          if (retcode == "CC 0000") {
            callback(true);
          } else if (retcode == "null") {
            awaitJobCompletion(jobId, callback, tries - 1, wait);
          } else {
            callback(false);
          }
      }
      );
  } else {
      callback(false);
  }
}

describe('Hello World', function () {
  // Change timeout to 15s from the default of 2s
  this.timeout(15000);

  describe('Output', function () {
    it('should return Hello World upon job completion', function (done) {
      // Submit job, await completion
      cmd.get(
        'bright jobs submit data-set "BAUMI07.PUBLIC.JCL(CBLTEST)" --rff jobid --rft string',
        function (err, data, stderr) {
          // Strip unwanted whitespace/newline
          data = data.trim();
      
          // Await the jobs completion
          awaitJobCompletion(data, function(successful){
            if(successful){
              assert(true, "Job successfully completed");
            // Verify the output
            cmd.get(
              'bright jobs view sfbi ' + data + ' 103',
              function (err, data, stderr) {
                assert.equal(data.trim(), "Hello, World!");
                done();
              }
            );
            } else {
              assert(false, "Job did not complete successfully");
              done();
            };
          });
        }
      );
    });
  });
});
