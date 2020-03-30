module.exports = async function assertRevert(promise) {
  let succeeded = false;
  try {
    await promise;
    succeeded = true;
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0 || error.message.search('invalid opcode') >= 0 || error.message.search('invalid JUMP') >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }
  if(succeeded) {
    assert.fail('Expected revert not received');
  }
};
