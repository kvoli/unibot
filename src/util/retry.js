export async function callAndRetry(fn, maxAmountOfRetries) {
  let error;
  for (let retries = 0; retries < maxAmountOfRetries; retries++) {
    try {
      return await fn();
    } catch (err) {
      error = err;
    }
  }
  throw error;
}
