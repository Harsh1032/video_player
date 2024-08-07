// import fs from 'fs';
// import path from 'path';

// if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
//   const jsonString = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON, 'base64').toString('utf-8');
//   const credentialsPath = path.join('/tmp', 'service-account-file.json');

//   fs.mkdirSync('/tmp', { recursive: true });
//   fs.writeFileSync(credentialsPath, jsonString);

//   console.log(`Service account credentials written to ${credentialsPath}`);
//   process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
// } else {
//   console.error("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set");
// }
